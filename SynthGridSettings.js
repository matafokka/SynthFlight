/**
 * Settings for SynthGridLayer
 *
 * @class
 * @extends L.ALS.Settings
 */
L.ALS.SynthGridSettings = L.ALS.Settings.extend( /** @lends L.ALS.SynthGridSettings.prototype */ {

	gridBorderColor: "#6495ed",
	gridFillColor: "#6495ed",
	meridiansColor: "#ad0000",
	parallelsColor: "#007800",
	lineThickness: 2,

	initialize: function () {
		L.ALS.Settings.prototype.initialize.call(this);

		this.addWidget(
			(new L.ALS.Widgets.Color("gridBorderColor", "defaultGridBorderColor")).setValue(this.gridBorderColor),
			this.gridBorderColor
		);

		this.addWidget(
			(new L.ALS.Widgets.Color("gridFillColor", "defaultGridFillColor")).setValue(this.gridFillColor),
			this.gridFillColor
		);

		this.addWidget(
			(new L.ALS.Widgets.Color("meridiansColor", "defaultMeridiansColor")).setValue(this.meridiansColor),
			this.meridiansColor
		);

		this.addWidget(
			(new L.ALS.Widgets.Color("parallelsColor", "defaultParallelsColor")).setValue(this.parallelsColor),
			this.parallelsColor
		);

		this.addWidget(
			(new L.ALS.Widgets.Number("lineThickness", "defaultLineThickness")).setMin(1).setMax(20).setValue(this.lineThickness),
			this.lineThickness
		);

		this.addWidget((new L.ALS.Widgets.Number("gridHidingFactor", "gridHidingFactor")).setMin(1).setMax(10).setValue(5), 5);
	}

});