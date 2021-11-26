/**
 * Selects or deselects polygon upon double click and redraws flight paths
 * @param event
 */
L.ALS.SynthGridLayer.prototype._selectOrDeselectPolygon = function (event) {
	let polygon = event.target;
	let name = this._generatePolygonName(polygon); // Generate name for current polygon
	if (!this.selectedPolygons[name]) {
		polygon.setStyle({fill: true});
		this.selectedPolygons[name] = polygon;

		let controlsContainer = new L.WidgetLayer(polygon.getLatLngs()[0][1], "topLeft").addWidgets(
			new L.ALS.Widgets.Number("zoneNumber", "zoneNumber", this, "_calculatePolygonParameters").setMin(1).setValue(1),
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

		this.selectedPolygonsWidgets[name] = controlsContainer;
		this.widgetsGroup.addLayer(controlsContainer);

	} else { // If this polygon is already selected, remove selection from it and don't do anything
		polygon.setStyle({fill: false});
		delete this.selectedPolygons[name];
		this.widgetsGroup.removeLayer(this.selectedPolygonsWidgets[name]);
		delete this.selectedPolygonsWidgets[name];
	}
	this.updateGrid();
	this.writeToHistory();
}

L.ALS.SynthGridLayer.prototype._calculatePolygonParameters = function () {
	this.selectedArea = 0;
	for (let name in this.selectedPolygons) {
		if (!this.selectedPolygons.hasOwnProperty(name))
			continue;

		let layer = this.selectedPolygons[name], latLngs = layer.getLatLngs()[0];
		let widgetContainer = this.selectedPolygonsWidgets[name];

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
	this._mergeSelectedPolygons();
	this.bordersGroup.clearLayers();
	if (this.mergedPolygons.length === 0) {
		this._clearPaths();
		return;
	}

	for (let polygon of this.mergedPolygons) {
		let latLngs = [];
		for (let p of polygon)
			latLngs.push([p[1], p[0]]);

		this.bordersGroup.addLayer(L.polyline(latLngs, {
				weight: this.lineThicknessValue * this.bordersGroup.thicknessMultiplier,
				color: this.getWidgetById("gridBorderColor").getValue()
			}
		));
	}
	this._drawPaths();
}