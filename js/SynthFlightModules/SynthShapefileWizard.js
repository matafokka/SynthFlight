L.ALS.SynthShapefileWizard = L.ALS.Wizard.extend({

	displayName: "shapefileDisplayName",

	initialize: function () {
		L.ALS.Wizard.prototype.initialize.call(this);
		this.addWidget(new L.ALS.Widgets.File("zippedShapefile", "zippedShapefile"));
	}

});