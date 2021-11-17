L.ALS.SynthLineLayer = L.ALS.SynthBaseDrawLayer.extend({
	defaultName: "Line Layer",
	hideCapturePoints: true,
	hidePathsConnections: false,

	init: function (wizardResults, settings) {

		this.drawControls = {
			polyline: {
				shapeOptions: {
					color: "#ff0000",
					weight: this.lineThicknessValue
				}
			}
		}
		L.ALS.SynthBaseDrawLayer.prototype.init.call(this, settings, "lineLayerColor");

		this.addWidgets(
			new L.ALS.Widgets.Checkbox("hideCapturePoints", "hideCapturePoints", this, "_hideCapturePoints").setValue(true),
			new L.ALS.Widgets.Checkbox("hidePathsConnections", "hidePathsConnections", this, "_hidePathsConnections"),
		);

		this.addBaseParametersInputSection();
		this.addBaseParametersOutputSection();

		this.pointsGroup = L.featureGroup();

		this.addEventListenerTo(this.map, "draw:drawstart draw:editstart draw:deletestart", "onEditStart");
		this.addEventListenerTo(this.map, "draw:drawstop draw:editstop draw:deletestop", "onEditEnd");
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

	onDraw: function (e) {
		L.ALS.SynthBaseDrawLayer.prototype.onDraw.call(this, e);
		e.layer.setStyle({
			color: this.getWidgetById("color0").getValue(),
			opacity: 1
		});
	},

	statics: {
		wizard: L.ALS.SynthLineWizard,
		settings: new L.ALS.SynthLineSettings(),
	}
});