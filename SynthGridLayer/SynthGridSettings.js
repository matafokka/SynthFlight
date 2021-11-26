/**
 * Settings for SynthGridLayer
 *
 * @class
 * @extends L.ALS.Settings
 */
L.ALS.SynthGridSettings = L.ALS.SynthBaseSettings.extend( /** @lends L.ALS.SynthGridSettings.prototype */ {

	gridBorderColor: "#6495ed",
	gridFillColor: "#6495ed",
	meridiansColor: "#ad0000",
	parallelsColor: "#007800",

	initialize: function () {
		L.ALS.SynthBaseSettings.prototype.initialize.call(this);

		this.addWidget(
			new L.ALS.Widgets.Color("gridBorderColor", "defaultGridBorderColor").setValue(this.gridBorderColor),
			this.gridBorderColor
		);

		this.addWidget(
			new L.ALS.Widgets.Color("gridFillColor", "defaultGridFillColor").setValue(this.gridFillColor),
			this.gridFillColor
		);

		this.addWidget(
			new L.ALS.Widgets.Color("color0", "defaultParallelsColor").setValue(this.parallelsColor),
			this.parallelsColor
		);

		this.addWidget(
			new L.ALS.Widgets.Color("color1", "defaultMeridiansColor").setValue(this.meridiansColor),
			this.meridiansColor
		);

		this.addWidget(new L.ALS.Widgets.Number("gridHidingFactor", "gridHidingFactor").setMin(1).setMax(10).setValue(5), 5);
	}

});