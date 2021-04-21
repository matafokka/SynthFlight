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

	/** @constructs */
	initialize: function () {
		L.ALS.Settings.prototype.initialize.call(this);

		let gridBorderColorWidget = new L.ALS.Widgets.Color("gridBorderColor", "defaultGridBorderColor");
		gridBorderColorWidget.setAttributes({
			value: this.gridBorderColor,
			defaultValue: this.gridBorderColor
		});

		let gridFillColorWidget = new L.ALS.Widgets.Color("gridFillColor", "defaultGridFillColor");
		gridFillColorWidget.setAttributes({
			value: this.gridFillColor,
			defaultValue: this.gridFillColor
		});

		let meridiansColorWidget = new L.ALS.Widgets.Color("meridiansColor", "defaultMeridiansColor");
		meridiansColorWidget.setAttributes({
			value: this.meridiansColor,
			defaultValue: this.meridiansColor
		});

		let parallelsColorWidget = new L.ALS.Widgets.Color("parallelsColor", "defaultParallelsColor");
		parallelsColorWidget.setAttributes({
			value: this.parallelsColor,
			defaultValue: this.parallelsColor
		});

		let lineThicknessWidget = new L.ALS.Widgets.Number("lineThickness", "defaultLineThickness");
		lineThicknessWidget.setAttributes({
			min: 1,
			max: 20,
			value: this.lineThickness,
			defaultValue: this.lineThickness
		});

		let optimizationWidget = new L.ALS.Widgets.Number("gridHidingFactor", "gridHidingFactor");
		optimizationWidget.setAttributes({
			min: 1,
			max: 10,
			value: 5,
			defaultValue: 5
		});

		for (let widget of [gridBorderColorWidget, gridFillColorWidget, meridiansColorWidget, parallelsColorWidget, lineThicknessWidget, optimizationWidget])
			this.addWidget(widget);
	}

});