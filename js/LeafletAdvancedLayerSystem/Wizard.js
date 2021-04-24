/**
 * Base class for all wizards. Basically {@link L.ALS.Widgetable} with additional {@link L.ALS.Wizard#displayName} property.
 * @class
 * @extends L.ALS.Widgetable
 */
L.ALS.Wizard = L.ALS.Widgetable.extend( /** @lends L.ALS.Wizard.prototype */ {

	/**
	 * Name of the layer type that will be displayed in the wizard window. You can use locale property to localize it.
	 * @type {string}
	 * @readonly
	 */
	displayName: "layerWizardName",

	initialize: function () {
		L.ALS.Widgetable.prototype.initialize.call(this);
	}
});