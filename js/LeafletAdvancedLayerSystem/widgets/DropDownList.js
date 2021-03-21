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
		option.text = item;
		this.input.appendChild(option);
		this.callCallback();
	},

	/**
	 * Removes item from this list, if it exists
	 * @param item {string} Content of the item
	 */
	removeItem: function (item) {
		for (let child of this.input.childNodes) {
			if (child.text === item) {
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
			if (option.value === item) {
				option.selected = "selected";
				this.callCallback();
				return;
			}
		}
	}

});