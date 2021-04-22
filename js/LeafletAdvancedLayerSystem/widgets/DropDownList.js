/**
 * A drop-down list
 *
 * @param id {string} ID of this input. You can select this object using this ID.
 * @param label {string} Label for this input. You can also pass locale property to localize the label.
 * @param callbackObject {Object|L.ALS.Serializable} Object which contains callback. Just pass "this". If you plan to use serialization, this object MUST be instance of L.ALS.Serializable.
 * @param callback {string} Name of the method of callbackObject that will be called when widget's value changes
 *
 * @class
 * @extends L.ALS.Widgets.BaseItemsWidget
 */
L.ALS.Widgets.DropDownList = L.ALS.Widgets.BaseItemsWidget.extend( /** @lends L.ALS.Widgets.DropDownList.prototype */ {

	/** @constructs */
	initialize: function (id, label, callbackObject = undefined, callback = "") {
		L.ALS.Widgets.BaseWidget.prototype.initialize.call(this, "", id, label, callbackObject, callback, ["change"]);
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
		return this;
	},

	removeItem: function (item) {
		for (let child of this.input.childNodes) {
			if (L.ALS.Locales.getLocalePropertyOrValue(child) === item) {
				this.input.removeChild(child);
				return this;
			}
		}
		return this;
	},

	selectItem: function (item) {
		// We do this because changing HTMLSelectElement.value doesn't work in IE
		for (let option of this.input.options) {
			if (L.ALS.Locales.getLocalePropertyOrValue(option) === item) {
				option.selected = "selected";
				this.callCallback();
				return this;
			}
		}
		return this;
	},

	getValue: function () {
		if (this.input.selectedIndex === -1)
			return undefined;
		return L.ALS.Locales.getLocalePropertyOrValue(this.input.options[this.input.selectedIndex]);
	},

});