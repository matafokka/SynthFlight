L.ALS.SynthShapefileSettings = L.ALS.Settings.extend({

	fillColor: "#ff9900",
	borderColor: "#8d4200",

	initialize: function () {
		L.ALS.Settings.prototype.initialize.call(this);

		let fillColor = new L.ALS.Widgets.Color("fillColor", "Default fill color");
		fillColor.setAttributes({
			value: this.fillColor,
			defaultValue: this.fillColor
		});

		let borderColor = new L.ALS.Widgets.Color("borderColor", "Default border color");
		borderColor.setAttributes({
			value: this.borderColor,
			defaultValue: this.borderColor
		});

		for (let widget of [fillColor, borderColor])
			this.addWidget(widget);
	}

});