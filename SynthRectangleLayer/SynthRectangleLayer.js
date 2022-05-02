require("./SynthRectangleWizard.js");
require("./SynthRectangleSettings.js");

L.ALS.SynthRectangleLayer = L.ALS.SynthRectangleBaseLayer.extend({

	defaultName: "Rectangle Layer",
	borderColorLabel: "rectangleBorderColor",
	fillColorLabel: "rectangleFillColor",

	init: function (wizardResults, settings) {
		L.ALS.SynthRectangleBaseLayer.prototype.init.call(this, wizardResults, settings);

		this.enableDraw({
			rectangle: {
				shapeOptions: {
					color: "#ff0000",
					weight: this.lineThicknessValue
				}
			}
		}, this.polygonGroup);
	},

	onEditEnd: function () {
		for (let name in this.polygons)
			this.removePolygon(this.polygons[name], false);
		this.polygons = {}

		let layersWereRemoved = false;

		this.polygonGroup.eachLayer((layer) => {
			let bounds = layer.getBounds(), topLeft = bounds.getNorthWest(),
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
				return;
			}

			this.addPolygon(layer);
		});

		if (layersWereRemoved)
			window.alert(L.ALS.locale.rectangleLayersRemoved);

		this.map.addLayer(this.labelsGroup); // Nothing in the base layer hides or shows it, so it's only hidden in code above
		this.updateLayersVisibility();
		this.calculateParameters();
		this.writeToHistory();
	},

	statics: {
		wizard: L.ALS.SynthRectangleWizard,
		settings: new L.ALS.SynthRectangleSettings(),
	}
});