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

		let layers = this.polygonGroup.getLayers();
		for (let i = 0; i < layers.length; i++)
			this.addPolygon(layers[i]);

		this.map.addLayer(this.labelsGroup); // Nothing in the base layer hides or shows it, so it's only hidden in code above
		this._updateLayersVisibility();
		this.updateAll();
	},

	statics: {
		wizard: L.ALS.SynthRectangleWizard,
		settings: new L.ALS.SynthRectangleSettings(),
	}
});