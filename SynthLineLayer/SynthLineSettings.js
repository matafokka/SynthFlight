L.ALS.SynthLineSettings = L.ALS.Settings.extend({

	initialize: function () {
		L.ALS.Settings.prototype.initialize.call(this);
		const color = "#ff0000";
		this.addWidget(new L.ALS.Widgets.Color("color", "settingsLineLayerColor").setValue(color), color);
	}

})