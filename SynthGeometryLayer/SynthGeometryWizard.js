/**
 * Wizard for SynthShapefileLayer
 * @class
 * @extends L.ALS.Wizard
 */
L.ALS.SynthGeometryWizard = L.ALS.Wizard.extend( /** @lends L.ALS.SynthGeometryWizard.prototype */ {

	displayName: "geometryDisplayName",

	initialize: function () {
		L.ALS.Wizard.prototype.initialize.call(this);
		if (!window.FileReader) {
			this.addWidget(new L.ALS.Widgets.SimpleLabel("lbl", "geometryBrowserNotSupported", "center", "error"));
			return;
		}
		this.addWidgets(
			new L.ALS.Widgets.File("geometryFileLabel", "geometryFileLabel"),
			new L.ALS.Widgets.SimpleLabel("geometryNotification", "geometryNotification", "center", "message")
		);
	}

});