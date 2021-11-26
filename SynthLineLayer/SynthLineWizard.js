L.ALS.SynthLineWizard = L.ALS.Wizard.extend({
	displayName: "lineLayerName",
	initialize: function () {
		L.ALS.Wizard.prototype.initialize.call(this);
		this.addWidget(new L.ALS.Widgets.SimpleLabel("lbl", "lineLayerWizardLabel").setStyle("message"));
	}
});