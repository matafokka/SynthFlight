/**
 * Defines methods for implementing widgets that can have multiple items, for example, drop-down lists and sets of radio buttons.
 * @class
 * @extends L.ALS.Widgets.BaseWidget
 */
L.ALS.Widgets.BaseItemsWidget = L.ALS.Widgets.BaseWidget.extend( /** @lends L.ALS.Widgets.BaseItemsWidget.prototype */ {

	/**
	 * Adds item to this widget
	 * @param item {string} Text content of the item. Can be a locale property. Use this string to access added item later.
	 * @return {L.ALS.Widgets.BaseItemsWidget} This
	 * @abstract
	 */
	addItem: function (item) { return this; },

	/**
	 * Adds all given items to this widget
	 * @param items {string} Items to add
	 * @return {L.ALS.Widgets.BaseItemsWidget} This
	 */
	addItems: function (...items) {
		for (let item of items)
			this.addItem(item);
		return this;
	},

	/**
	 * Removes item from this widget if it exists
	 * @param item {string} Item to remove
	 * @return {L.ALS.Widgets.BaseItemsWidget} This
	 * @abstract
	 */
	removeItem: function (item) { return this; },

	/**
	 * Selects item if it exists.
	 * @param item {string} item to select
	 * @return {L.ALS.Widgets.BaseItemsWidget} This
	 * @abstract
	 */
	selectItem: function (item) { return this; },

	/**
	 * Alias for {@link L.ALS.Widgets.BaseItemsWidget#selectItem}
	 * @param value {string} Value to set
	 * @return {L.ALS.Widgets.BaseItemsWidget} This
	 */
	setValue: function (value) {
		this.selectItem(value);
		return this;
	},

	/**
	 * @return {string} Currently selected item's name
	 * @abstract
	 */
	getValue: function () {
		return "";
	}

});