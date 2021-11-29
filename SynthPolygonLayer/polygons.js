L.ALS.SynthPolygonLayer.prototype.addPolygon = function (polygon) {
	let name = this._generatePolygonName(polygon);

	polygon.setStyle({fill: true});
	this.polygons[name] = polygon;

	let controlsContainer = new L.WidgetLayer(polygon.getLatLngs()[0][1], "topLeft");

	if (this.useZoneNumbers)
		controlsContainer.addWidget(new L.ALS.Widgets.Number("zoneNumber", "zoneNumber", this, "_calculatePolygonParameters").setMin(1).setValue(1));

	controlsContainer.addWidgets(
		new L.ALS.Widgets.Number("minHeight", "minHeight", this, "_calculatePolygonParameters").setMin(1).setValue(1),
		new L.ALS.Widgets.Number("maxHeight", "maxHeight", this, "_calculatePolygonParameters").setMin(1).setValue(1),
		new L.ALS.Widgets.ValueLabel("meanHeight", "meanHeight", "m"),
		new L.ALS.Widgets.ValueLabel("absoluteHeight", "absoluteHeight", "m"),
		new L.ALS.Widgets.ValueLabel("elevationDifference", "elevationDifference"),
		new L.ALS.Widgets.ValueLabel("reliefType", "reliefType"),
		new L.ALS.Widgets.SimpleLabel("error").setStyle("error"),
		new L.ALS.Widgets.ValueLabel("lngCellSizeInMeters", "lngCellSizeInMeters", "m").setNumberOfDigitsAfterPoint(0),
		new L.ALS.Widgets.ValueLabel("latCellSizeInMeters", "latCellSizeInMeters", "m").setNumberOfDigitsAfterPoint(0),
	);

	let toFormatNumbers = ["meanHeight", "absoluteHeight", "elevationDifference", "lngCellSizeInMeters", "latCellSizeInMeters"];
	for (let id of toFormatNumbers)
		controlsContainer.getWidgetById(id).setFormatNumbers(true);

	this.polygonsWidgets[name] = controlsContainer;
	this.widgetsGroup.addLayer(controlsContainer);
}

L.ALS.SynthPolygonLayer.prototype.removePolygon = function (polygon, removeFromObject = true) {
	let name = this._generatePolygonName(polygon);
	if (removeFromObject)
		delete this.polygons[name];
	this.widgetsGroup.removeLayer(this.polygonsWidgets[name]);
	delete this.polygonsWidgets[name];
}

L.ALS.SynthPolygonLayer.prototype._calculatePolygonParameters = function () {
	this.selectedArea = 0;
	for (let name in this.polygons) {
		if (!this.polygons.hasOwnProperty(name))
			continue;

		let layer = this.polygons[name], latLngs = layer.getLatLngs()[0];
		let widgetContainer = this.polygonsWidgets[name];

		layer.lngCellSizeInMeters = this.getLineLengthMeters([latLngs[0], latLngs[1]], false);
		layer.latCellSizeInMeters = this.getLineLengthMeters([latLngs[1], latLngs[2]], false);

		this.selectedArea += layer.lngCellSizeInMeters * layer.latCellSizeInMeters;

		widgetContainer.getWidgetById("lngCellSizeInMeters").setValue(layer.lngCellSizeInMeters);
		widgetContainer.getWidgetById("latCellSizeInMeters").setValue(layer.latCellSizeInMeters);

		layer.minHeight = widgetContainer.getWidgetById("minHeight").getValue();
		layer.maxHeight = widgetContainer.getWidgetById("maxHeight").getValue();

		let errorLabel = widgetContainer.getWidgetById("error");
		if (layer.minHeight > layer.maxHeight) {
			errorLabel.setValue("errorMinHeightBiggerThanMaxHeight");
			continue;
		}
		errorLabel.setValue("");

		layer.meanHeight = Math.round((layer.maxHeight + layer.minHeight) / 2);
		layer.absoluteHeight = this["flightHeight"] + layer.meanHeight;

		layer.elevationDifference = (layer.maxHeight - layer.minHeight) / this["flightHeight"];
		layer.reliefType = (layer.elevationDifference >= 0.2) ? "Variable" : "Plain";

		let names = ["meanHeight", "absoluteHeight", "elevationDifference", "reliefType"];
		for (let name of names) {
			let value;
			try {
				value = this.toFixed(layer[name]);
			} catch (e) {
				value = layer[name];
			}
			widgetContainer.getWidgetById(name).setValue(value);
		}
	}
	this.getWidgetById("selectedArea").setValue(this.selectedArea);

	// Draw thick borders around selected polygons
	this.mergePolygons();
	this.bordersGroup.clearLayers();
	if (this.mergedPolygons.length === 0) {
		this._clearPaths();
		return;
	}

	for (let polygon of this.mergedPolygons) {
		let latLngs = [];
		for (let p of polygon)
			latLngs.push([p[1], p[0]]);

		if (!this.useZoneNumbers)
			continue;

		this.bordersGroup.addLayer(L.polyline(latLngs, {
				weight: this.lineThicknessValue * this.bordersGroup.thicknessMultiplier,
				color: this.getWidgetById("borderColor").getValue()
			}
		));
	}
	this._drawPaths();
}