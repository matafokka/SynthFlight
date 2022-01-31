require("./SynthRectangleWizard.js");
require("./SynthRectangleSettings.js");

L.ALS.SynthRectangleLayer = L.ALS.SynthPolygonLayer.extend({

	defaultName: "Rectangle Layer",
	borderColorLabel: "rectangleBorderColor",
	fillColorLabel: "rectangleFillColor",

	init: function (wizardResults, settings) {
		L.ALS.SynthPolygonLayer.prototype.init.call(this, wizardResults, settings);

		this.enableDraw({
			rectangle: {
				shapeOptions: {
					color: "#ff0000",
					weight: this.lineThicknessValue
				}
			}
		}, this.polygonGroup);
	},

	onEditStart: function () {
		let groups = ["labelsGroup", "widgetsGroup", "pathsByParallels", "pathsByMeridians", "parallelsInternalConnections", "parallelsExternalConnections", "meridiansInternalConnections", "meridiansExternalConnections", "latPointsGroup", "lngPointsGroup"];
		for (let group of groups)
			this.hideOrShowLayer(true, this[group]);
	},

	onEditEnd: function () {
		for (let name in this.polygons)
			this.removePolygon(this.polygons[name], false);
		this.polygons = {}

		let layers = this.polygonGroup.getLayers(), layersWereRemoved = false;

		for (let i = 0; i < layers.length; i++) {
			let layer = layers[i], bounds = layer.getBounds(), topLeft = bounds.getNorthWest(),
				arrTopLeft = [topLeft.lng, topLeft.lat],
				lngDiff = Math.abs(bounds.getWest() - bounds.getEast()),
				latDiff = Math.abs(bounds.getNorth() - bounds.getSouth()),
				lngLength = this.getArcAngleByLength(arrTopLeft, this.By, false),
				latLength = this.getArcAngleByLength(arrTopLeft, this.By, true),
				lngPathsCount = Math.round(lngDiff / lngLength), latPathsCount = Math.round(latDiff / latLength);

			// Limit polygon size by limiting total approximate paths count. This is not 100% accurate but close enough.
			if (lngPathsCount + latPathsCount > 150) {
				layersWereRemoved = true;
				this.polygonGroup.removeLayer(layer);
				continue;
			}

			this.addPolygon(layer);
		}

		if (layersWereRemoved)
			window.alert(L.ALS.locale.rectangleLayersRemoved);

		this.map.addLayer(this.labelsGroup); // Nothing in the base layer hides or shows it, so it's only hidden in code above
		this._updateLayersVisibility();
		this.updateAll();
		this.writeToHistory();
	},

	_setColor: function (widget) {
		L.ALS.SynthPolygonLayer.prototype._setColor.call(this, widget);
		this.updateRectanglesColors();
	},

	updateRectanglesColors: function () {
		let color = this.getWidgetById("borderColor").getValue(),
			fillColor = this.getWidgetById("fillColor").getValue();
		for (let id in this.polygons)
			this.polygons[id].setStyle({color, fillColor});
	},

	statics: {
		wizard: L.ALS.SynthRectangleWizard,
		settings: new L.ALS.SynthRectangleSettings(),
		deserialize: function (serialized, layerSystem, settings, seenObjects) {
			let deserialized = L.ALS.SynthPolygonLayer.deserialize(serialized, layerSystem, settings, seenObjects);
			for (let id in deserialized.polygons)
				deserialized.polygonGroup.addLayer(deserialized.polygons[id]);
			deserialized.updateRectanglesColors();
			return deserialized;
		}
	}
});