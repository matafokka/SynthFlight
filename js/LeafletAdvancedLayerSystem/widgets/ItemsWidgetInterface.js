/**
 * Defines methods for implementing widgets that can have multiple items, for example, drop-down lists and sets of radio buttons.
 *
 */
L.ALS.Widgets.ItemsWidgetInterface = L.ALS.Widgets.BaseWidget.extend({

	/**
	 * Adds item to this widget
	 * @param item {string} Text content of the item. Can be a locale property. Use this string to access added item later.
	 */
	addItem: function (item) {},

	/**
	 * Removes item from this widget if it exists
	 * @param item {string} Item to remove
	 */
	removeItem: function (item) {},

	/**
	 * Selects item if it exists.
	 * @param item {string} item to select
	 */
	selectItem: function (item) {},

	/**
	 * Alias for `selectItem()`
	 * @param value {string} Value to set
	 */
	setValue: function (value) {
		this.selectItem(value);
	},

	/**
	 * @return {string} Currently selected item's name
	 */
	getValue: function () {
		return "";
	}

});