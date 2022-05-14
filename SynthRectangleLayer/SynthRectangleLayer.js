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

	onEditEnd: function () {
		if (!this.isSelected)
			return;

		for (let name in this.polygons)
			this.removePolygon(this.polygons[name], false);

		this.polygons = {}
		this.invalidPolygons = {};

		let layersWereInvalidated = false;

		this.polygonGroup.eachLayer((layer) => {
			// Remove a linked layer when a layer either original or cloned has been removed
			if (layer.linkedLayer && !this.polygonGroup.hasLayer(layer.linkedLayer)) {
				this.polygonGroup.removeLayer(layer);
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

		if (layersWereInvalidated)
			window.alert(L.ALS.locale.rectangleLayersSkipped);

		this.map.addLayer(this.labelsGroup); // Nothing in the base layer hides or shows it, so it's only hidden in code above
		this.updateLayersVisibility();
		this.calculateParameters();
		this.writeToHistoryDebounced();
	},

	statics: {
		wizard: L.ALS.SynthRectangleWizard,
		settings: new L.ALS.SynthRectangleSettings(),
	}
});