/**
 * Settings for SynthPolygonLayer
 *
 * @class
 * @extends L.ALS.Settings
 */
L.ALS.SynthPolygonSettings = L.ALS.SynthBaseSettings.extend( /** @lends L.ALS.SynthPolygonSettings.prototype */ {

	borderColor: "#6495ed",
	fillColor: "#6495ed",
	meridiansColor: "#ad0000",
	parallelsColor: "#007800",

	addColorWidgets: function (borderLabel, fillLabel) {
		this.addWidget(
			new L.ALS.Widgets.Color("borderColor", borderLabel).setValue(this.borderColor),
			this.borderColor
		);

		this.addWidget(
			new L.ALS.Widgets.Color("fillColor", fillLabel).setValue(this.fillColor),
			this.fillColor
		);

		this.addWidget(
			new L.ALS.Widgets.Color("color0", "defaultParallelsColor").setValue(this.parallelsColor),
			this.parallelsColor
		);

		this.addWidget(
			new L.ALS.Widgets.Color("color1", "defaultMeridiansColor").setValue(this.meridiansColor),
			this.meridiansColor
		);
	}

});