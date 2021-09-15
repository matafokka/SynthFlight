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
			new L.ALS.Widgets.SimpleLabel("error").setStyle("error")
		);

		let toFormatNumbers = ["meanHeight", "absoluteHeight", "elevationDifference"];
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
	let areaIncrement = Math.round(this["latCellSizeInMeters"] * this["lngCellSizeInMeters"]);
	this.selectedArea = 0;
	let unitedPolygons = undefined;
	for (let name in this.selectedPolygons) {
		if (!this.selectedPolygons.hasOwnProperty(name))
			continue;
		unitedPolygons = this._addSelectedPolygonToGeoJSON(unitedPolygons, name);
		this.selectedArea += areaIncrement;

		let layer = this.selectedPolygons[name];
		let widgetContainer = this.selectedPolygonsWidgets[name];

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
	this.bordersGroup.clearLayers();
	if (unitedPolygons === undefined)
		return;
	let geometry = unitedPolygons.geometry;
	let isMultiPolygon = (geometry.type === "MultiPolygon");
	for (let polygon of geometry.coordinates) {
		let line = L.polyline([], {
			color: this.gridBorderColor,
			weight: this.lineThicknessValue * 2
		});
		let coordinates = isMultiPolygon ? polygon[0] : polygon;
		for (let coordinate of coordinates)
			line.addLatLng([coordinate[1], coordinate[0]]);
		this.bordersGroup.addLayer(line);
	}
}