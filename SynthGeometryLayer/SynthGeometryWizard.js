/**
 * Wizard for SynthGeometryLayer
 * @class
 * @extends L.ALS.Wizard
 */
L.ALS.SynthGeometryWizard = L.ALS.SynthGeometryBaseWizard.extend( /** @lends L.ALS.SynthGeometryWizard.prototype */ {

	displayName: "geometryDisplayName",
	browserNotSupportedLabel: "geometryBrowserNotSupported",

	initialize: function () {
		L.ALS.SynthGeometryBaseWizard.prototype.initialize.call(this);
		if (!window.FileReader)
			return;

		this.addWidget(
			new L.ALS.Widgets.SimpleLabel("geometryNotification", "geometryNotification", "center", "message")
		);
	}

});