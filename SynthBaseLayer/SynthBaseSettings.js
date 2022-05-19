L.ALS.SynthBaseSettings = L.ALS.Settings.extend({

	lineThickness: 2,

	initialize: function () {
		L.ALS.Settings.prototype.initialize.call(this);

		this.addWidget(
			new L.ALS.Widgets.Number("lineThicknessValue", "defaultLineThickness").setMin(1).setMax(20).setValue(this.lineThickness),
			this.lineThickness
		);
	}

})