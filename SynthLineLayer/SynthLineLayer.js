require("./SynthLineWizard.js");
require("./SynthLineSettings.js");

L.ALS.SynthLineLayer = L.ALS.SynthBaseLayer.extend({
	defaultName: "Line Layer",
	hideCapturePoints: true,
	hidePathsConnections: false,
	hasYOverlay: false,

	init: function (wizardResults, settings) {
		this.drawingGroup = L.featureGroup();
		this.connectionsGroup = L.featureGroup();

		L.ALS.SynthBaseLayer.prototype.init.call(this, settings, this.drawingGroup, this.connectionsGroup, "lineLayerColor");

		this.enableDraw({
			polyline: {
				shapeOptions: {
					color: "#ff0000",
					weight: this.lineThicknessValue
				}
			}
		}, this.drawingGroup);

		this.addWidgets(
			new L.ALS.Widgets.Checkbox("hideCapturePoints", "hideCapturePoints", this, "_hideCapturePoints").setValue(true),
			new L.ALS.Widgets.Checkbox("hidePathsConnections", "hidePathsConnections", this, "_hidePathsConnections"),
		);

		this.addBaseParametersInputSection();
		this.addBaseParametersOutputSection();

		this.pointsGroup = L.featureGroup();
		this.calculateParameters();
	},

	onEditStart: function () {
		this.map.removeLayer(this.connectionsGroup);
		this.map.removeLayer(this.pointsGroup);
	},

	onEditEnd: function () {
		this.updatePathsMeta();

		if (!this.getWidgetById("hidePathsConnections").getValue())
			this.map.addLayer(this.connectionsGroup);

		if (!this.getWidgetById("hideCapturePoints").getValue())
			this.map.addLayer(this.pointsGroup);
	},

	statics: {
		wizard: L.ALS.SynthLineWizard,
		settings: new L.ALS.SynthLineSettings(),
	}
});