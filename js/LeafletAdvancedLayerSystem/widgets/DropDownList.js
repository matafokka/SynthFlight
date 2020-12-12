L.ALS.Widgets.DropDownList = L.ALS.Widgets.BaseWidget.extend({

	/**
	 * Constructs DropDownList
	 */
	initialize: function (id, label, objectToControl, callback) {
		L.ALS.Widgets.BaseWidget.prototype.initialize.call(this, "", id, label, objectToControl, callback, ["change"]);
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
		L.ALS.dispatchEvent(this.input, "change");
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
	}

});