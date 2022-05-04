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

		this.clearLabels("polygonErrorsLabelsIDs");

		let layersWereRemoved = false;

		this.polygonGroup.eachLayer((layer) => {
			let bounds = layer.getBounds(), topLeft = bounds.getNorthWest(),
				parallelsPathsCount = Math.ceil(this.getParallelOrMeridianLineLength(topLeft, bounds.getSouthWest()) / this.By) + 1,
				meridiansPathsCount = Math.ceil(this.getParallelOrMeridianLineLength(topLeft, bounds.getNorthEast()) / this.By) + 1;

			// Limit polygon size by limiting total approximate paths count. This is not 100% accurate but close enough.
			if (meridiansPathsCount + parallelsPathsCount > 150) {
				layersWereRemoved = true;
				this.denyPolygon(layer, "polygonTooBig");
				return;
			}

			this.addPolygon(layer);
		});

		if (layersWereRemoved)
			window.alert(L.ALS.locale.rectangleLayersSkipped);

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