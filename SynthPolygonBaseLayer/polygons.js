/**
 * Serializable button handler for getting mean height from min and max heights
 *
 * @class
 * @extends L.ALS.Serializable
 */
L.ALS.MeanHeightButtonHandler = L.ALS.Serializable.extend( /**@lends L.ALS.MeanHeightButtonHandler.prototype */ {

	initialize: function (controlsContainer) {
		this._widgetable = controlsContainer;
	},

	handle: function () {
		this._widgetable.getWidgetById("meanHeight").setValue(
			(this._widgetable.getWidgetById("minHeight").getValue() + this._widgetable.getWidgetById("maxHeight").getValue()) / 2
		);
	}
})

L.ALS.SynthPolygonBaseLayer.prototype.addPolygon = function (polygon) {
	polygon._intName = this._generatePolygonName(polygon);

	polygon.setStyle({fill: true});
	this.polygons[polygon._intName] = polygon;

	let controlsContainer = new L.WidgetLayer(polygon.getLatLngs()[0][1], "topLeft"),  handler = new L.ALS.MeanHeightButtonHandler(controlsContainer);

	if (this.useZoneNumbers)
		controlsContainer.addWidget(new L.ALS.Widgets.Number("zoneNumber", "zoneNumber", this, "calculatePolygonParameters").setMin(1).setValue(1));

	controlsContainer.addWidgets(
		new L.ALS.Widgets.Number("minHeight", "minHeight", this, "calculatePolygonParameters").setMin(1).setValue(1),
		new L.ALS.Widgets.Number("maxHeight", "maxHeight", this, "calculatePolygonParameters").setMin(1).setValue(1),
		new L.ALS.Widgets.Number("meanHeight", "meanHeight", this, "calculatePolygonParameters").setMin(1).setValue(1),
		new L.ALS.Widgets.Button("meanFromMinMax", "meanFromMinMax", handler, "handle"),
		new L.ALS.Widgets.ValueLabel("absoluteHeight", "absoluteHeight", "m"),
		new L.ALS.Widgets.ValueLabel("elevationDifference", "elevationDifference"),
		new L.ALS.Widgets.ValueLabel("reliefType", "reliefType"),
		new L.ALS.Widgets.SimpleLabel("error").setStyle("error"),
	);

	if (this.calculateCellSizeForPolygons) {
		controlsContainer.addWidgets(
			new L.ALS.Widgets.ValueLabel("lngCellSizeInMeters", "lngCellSizeInMeters", "m").setNumberOfDigitsAfterPoint(0),
			new L.ALS.Widgets.ValueLabel("latCellSizeInMeters", "latCellSizeInMeters", "m").setNumberOfDigitsAfterPoint(0),
		)
	}

	let toFormatNumbers = ["absoluteHeight", "elevationDifference", "lngCellSizeInMeters", "latCellSizeInMeters"];
	for (let id of toFormatNumbers) {
		let widget = controlsContainer.getWidgetById(id);
		if (widget)
			widget.setFormatNumbers(true);
	}

	this.polygonsWidgets[polygon._intName] = controlsContainer;
	this.widgetsGroup.addLayer(controlsContainer);
}

L.ALS.SynthPolygonBaseLayer.prototype.removePolygon = function (polygon, removeFromObject = true) {
	let name = polygon._intName || this._generatePolygonName(polygon);
	if (removeFromObject)
		delete this.polygons[name];
	this.widgetsGroup.removeLayer(this.polygonsWidgets[name]);
	delete this.polygonsWidgets[name];
}

L.ALS.SynthPolygonBaseLayer.prototype.calculatePolygonParameters = function (widget) {
	for (let name in this.polygons) {
		if (!this.polygons.hasOwnProperty(name))
			continue;

		let layer = this.polygons[name], latLngs = layer.getLatLngs()[0];
		let widgetContainer = this.polygonsWidgets[name];

		if (this.calculateCellSizeForPolygons) {
			layer.lngCellSizeInMeters = this.getParallelOrMeridianLineLength(latLngs[0], latLngs[1], false);
			layer.latCellSizeInMeters = this.getParallelOrMeridianLineLength(latLngs[1], latLngs[2], false);

			widgetContainer.getWidgetById("lngCellSizeInMeters").setValue(layer.lngCellSizeInMeters);
			widgetContainer.getWidgetById("latCellSizeInMeters").setValue(layer.latCellSizeInMeters);
		}

		layer.minHeight = widgetContainer.getWidgetById("minHeight").getValue();
		layer.maxHeight = widgetContainer.getWidgetById("maxHeight").getValue();

		let errorLabel = widgetContainer.getWidgetById("error");
		if (layer.minHeight > layer.maxHeight) {
			errorLabel.setValue("errorMinHeightBiggerThanMaxHeight");
			continue;
		}
		errorLabel.setValue("");

		layer.meanHeight = widgetContainer.getWidgetById("meanHeight").getValue();
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
}

L.ALS.SynthPolygonBaseLayer.prototype.invalidatePolygon = function (polygon) {
	polygon.setStyle({color: "red", fillColor: "red"});
}