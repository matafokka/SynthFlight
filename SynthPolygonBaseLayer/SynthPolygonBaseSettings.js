/**
 * Settings for SynthRectangleBaseLayer
 *
 * @class
 * @extends L.ALS.Settings
 */
L.ALS.SynthPolygonBaseSettings = L.ALS.SynthBaseSettings.extend( /** @lends L.ALS.SynthPolygonBaseSettings.prototype */ {

	borderColor: "#6495ed",
	fillColor: "#6495ed",
	meridiansColor: "#ad0000",
	parallelsColor: "#007800",

	addColorWidgets: function (borderLabel, fillLabel, useTwoPaths = true) {
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

		if (!useTwoPaths)
			return;

		this.addWidget(
			new L.ALS.Widgets.Color("color1", "defaultMeridiansColor").setValue(this.meridiansColor),
			this.meridiansColor
		);
	}

});