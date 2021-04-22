/**
 * Base class for all settings. Basically, `Widgetable` without constructor arguments and with `getSettings()` additional method.
 *
 * @class L.ALS.Settings
 * @extends L.ALS.Widgetable
 */
L.ALS.Settings = L.ALS.Widgetable.extend( /** @lends L.ALS.Settings.prototype */ {

	/** @constructs */
	initialize: function () {
		L.ALS.Widgetable.prototype.initialize.call(this);
	},

	/**
	 * Adds widget to this widgetable
	 * @param widget {L.ALS.Widgets.BaseWidget} Widget to add
	 * @param defaultValue {*} Value that will be set to the widget when user will press revert button
	 * @return {L.ALS.Settings} This
	 */
	addWidget: function (widget, defaultValue) {
		widget._defaultSettingsValue = defaultValue;
		L.ALS.Widgetable.prototype.addWidget.call(this, widget);
		return this;
	},

	/**
	 * Does nothing, just call addWidget() multiple times
	 * @return {L.ALS.Settings} This
	 */
	addWidgets: function() {
		return this;
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