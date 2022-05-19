L.ALS.SynthLineSettings = L.ALS.SynthBaseSettings.extend({

	initialize: function () {
		L.ALS.SynthBaseSettings.prototype.initialize.call(this);
		const color = "#d900ff";
		this.addWidget(new L.ALS.Widgets.Color("color0", "settingsLineLayerColor").setValue(color), color);
	}

});