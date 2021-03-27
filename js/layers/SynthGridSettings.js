L.ALS.SynthGridSettings = L.ALS.Settings.extend({

	gridBorderColor: "#6495ed",
	gridFillColor: "#6495ed",
	meridiansColor: "#ad0000",
	parallelsColor: "#007800",
	lineThickness: 2,

	initialize: function () {
		L.ALS.Settings.prototype.initialize.call(this);

		let gridBorderColorWidget = new L.ALS.Widgets.Color("gridBorderColor", "Default grid fill color");
		gridBorderColorWidget.setAttributes({
			value: this.gridBorderColor,
			defaultValue: this.gridBorderColor
		});

		let gridFillColorWidget = new L.ALS.Widgets.Color("gridFillColor", "Default grid border color");
		gridFillColorWidget.setAttributes({
			value: this.gridFillColor,
			defaultValue: this.gridFillColor
		});

		let meridiansColorWidget = new L.ALS.Widgets.Color("meridiansColor", "Paths by meridians default color");
		meridiansColorWidget.setAttributes({
			value: this.meridiansColor,
			defaultValue: this.meridiansColor
		});

		let parallelsColorWidget = new L.ALS.Widgets.Color("parallelsColor", "Paths by parallels default color");
		parallelsColorWidget.setAttributes({
			value: this.parallelsColor,
			defaultValue: this.parallelsColor
		});

		let lineThicknessWidget = new L.ALS.Widgets.Number("lineThickness", "Default line thickness");
		lineThicknessWidget.setAttributes({
			min: 1,
			max: 20,
			value: this.lineThickness,
			defaultValue: this.lineThickness
		});

		let optimizationWidget = new L.ALS.Widgets.Number("gridHidingFactor", "Increase responsiveness by hiding grid at higher zoom levels. The higher the following value, the more responsive program will be");
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