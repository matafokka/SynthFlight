/**
 * Base class for all settings. Basically, `Widgetable` without constructor arguments and with `getSettings()` additional method.
 */
L.ALS.Settings = L.ALS.Widgetable.extend({

	initialize: function () {
		L.ALS.Widgetable.prototype.initialize.call(this);
	},

	/**
	 * @return {Object} Settings as {name: value} pairs
	 */
	getSettings: function () {
		let settings = {
			skipSerialization: true,
			skipDeserialization: true,
		};
		for (let w in this._widgets) {
			if (this._widgets.hasOwnProperty(w))
				settings[w] = this._widgets[w].getValue();
		}
		return settings;
	}
});