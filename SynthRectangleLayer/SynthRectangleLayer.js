require("./SynthRectangleWizard.js");
require("./SynthRectangleSettings.js");

/**
 * Rectangle layer
 *
 * @class
 * @extends L.ALS.SynthRectangleBaseLayer
 */
L.ALS.SynthRectangleLayer = L.ALS.SynthRectangleBaseLayer.extend(/** @lends L.ALS.SynthRectangleLayer.prototype */{

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
		this.isAfterDeserialization = false;
	},

	onEditEnd: function (e, notifyIfLayersSkipped = true) {
		if (!this.isSelected)
			return;

		this.clearPaths();

		let layersWereInvalidated = false;

		this.polygonGroup.eachLayer(layer => {
			// Remove a linked layer when a layer either original or cloned has been removed
			if (layer.linkedLayer && !this.polygonGroup.hasLayer(layer.linkedLayer)) {
				this.removePolygon(layer);
				return;
			}

			// Skip cloned layers
			if (layer.isCloned)
				return;

			this.cloneLayerIfNeeded(layer);

			// Limit polygon size by limiting total paths count
			let bounds = layer.getBounds(), topLeft = bounds.getNorthWest(),
				parallelsPathsCount = Math.ceil(this.getParallelOrMeridianLineLength(topLeft, bounds.getSouthWest()) / this.By) + 1,
				meridiansPathsCount = Math.ceil(this.getParallelOrMeridianLineLength(topLeft, bounds.getNorthEast()) / this.By) + 1;

			if (meridiansPathsCount + parallelsPathsCount > 150) {
				layersWereInvalidated = true;
				this.invalidatePolygon(layer);
				return;
			}

			this.addPolygon(layer);
		});

		this.afterEditEnd(L.ALS.locale.rectangleLayersSkipped, layersWereInvalidated, e, !notifyIfLayersSkipped);
	},

	statics: {
		wizard: L.ALS.SynthRectangleWizard,
		settings: new L.ALS.SynthRectangleSettings(),
	}
});