L.ALS.SynthShapefileWizard = L.ALS.Wizard.extend({

	displayName: "Zipped Shapefile Layer",

	initialize: function () {
		L.ALS.Wizard.prototype.initialize.call(this);
		this.addWidget(new L.ALS.Widgets.File("zippedShapefile", "Zipped shapefile"));
	}

});