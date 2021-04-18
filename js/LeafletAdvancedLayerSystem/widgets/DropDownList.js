L.ALS.Widgets.DropDownList = L.ALS.Widgets.ItemsWidgetInterface.extend({

	initialize: function (id, label, objectToControl, callback) {
		L.ALS.Widgets.BaseWidget.prototype.initialize.call(this, "", id, label, objectToControl, callback, ["change"]);
		this.setConstructorArguments(arguments);
	},

	createInputElement: function () {
		return document.createElement("select");
	},

	addItem: function (item) {
		let option = document.createElement("option");
		L.ALS.Locales.localizeOrSetValue(option, item, "text");
		this.input.appendChild(option);
		this.callCallback();
	},

	removeItem: function (item) {
		for (let child of this.input.childNodes) {
			if (L.ALS.Locales.getLocalePropertyOrValue(child) === item) {
				this.input.removeChild(child);
				return;
			}
		}
	},

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

});