/**
 * Base class for all settings. Basically, `Widgetable` without constructor arguments.
 */
L.ALS.Settings = L.ALS.Widgetable.extend({
	initialize: function () {
		L.ALS.Widgetable.prototype.initialize.call(this);
	}
});