L.ALS.Widgets.DropDownList = L.ALS.Widgets.BaseWidget.extend({

	/**
	 * Constructs DropDownList
	 */
	initialize: function (id, label, objectToControl, callback) {
		L.ALS.Widgets.BaseWidget.prototype.initialize.call(this, "", id, label, objectToControl, callback, ["change"]);
		this.setConstructorArguments(arguments);
	},

	createInputElement: function () {
		return document.createElement("select");
	},

	/**
	 * Adds item to this list
	 * @param item {string} Content of the item
	 */
	addItem: function (item) {
		let option = document.createElement("option");
		L.ALS.Locales.localizeOrSetValue(option, item, "text");
		this.input.appendChild(option);
		this.callCallback();
	},

	/**
	 * Removes item from this list, if it exists
	 * @param item {string} Content of the item
	 */
	removeItem: function (item) {
		for (let child of this.input.childNodes) {
			if (L.ALS.Locales.getLocalePropertyOrValue(child) === item) {
				this.input.removeChild(child);
				return;
			}
		}
	},

	/**
	 * Selects specific item.
	 * @param item {string} String that you've passed to addItem().
	 */
	selectItem: function (item) {
		// We do this because changing HTMLSelectElement.value doesn't work in IE
		for (let option of this.input.options) {
			if (L.ALS.Locales.getLocalePropertyOrValue(option) === item) {
				option.selected = "selected";
				this.callCallback();
				return;
			}
		}
	},

	getValue: function () {
		if (this.input.selectedIndex === -1)
			return undefined;
		return L.ALS.Locales.getLocalePropertyOrValue(this.input.options[this.input.selectedIndex]);
	},

	setValue: function (value) {
		this.selectItem(value);
	},

});