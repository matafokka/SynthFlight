/**
 * Base class for all wizards. Basically `Widgetable` but with one additional property.
 */
L.ALS.Wizard = L.ALS.Widgetable.extend({

	/**
	 * Name of the layer type that will be displayed in the wizard window. You can use locale property to localize it.
	 */
	displayName: "layerWizardName",

	initialize: function () {
		L.ALS.Widgetable.prototype.initialize.call(this);
	}
});