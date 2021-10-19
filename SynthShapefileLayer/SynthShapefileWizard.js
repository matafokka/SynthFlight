/**
 * Wizard for SynthShapefileLayer
 * @class
 * @extends L.ALS.Wizard
 */
L.ALS.SynthShapefileWizard = L.ALS.Wizard.extend( /** @lends L.ALS.SynthShapefileWizard.prototype */ {

	displayName: "shapefileDisplayName",

	initialize: function () {
		L.ALS.Wizard.prototype.initialize.call(this);
		this.addWidget(new L.ALS.Widgets.File("zippedShapefile", "zippedShapefile"));
	}

});