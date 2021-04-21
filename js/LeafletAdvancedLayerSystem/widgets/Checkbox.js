/**
 * Checkbox widget. Unchecked by default.
 *
 * @param id {string} ID of this input. You can select this object using this ID.
 * @param label {string} Label for this input. You can also pass locale property to localize the label.
 * @param callbackObject {Object|L.ALS.Serializable} Object which contains callback. Just pass "this". If you plan to use serialization, this object MUST be instance of L.ALS.Serializable.
 * @param callback {string} Name of the method of callbackObject that will be called when widget's value changes
 *
 * @class
 * @extends L.ALS.Widgets.BaseWidget
 */
L.ALS.Widgets.Checkbox = L.ALS.Widgets.BaseWidget.extend( /** @lends L.ALS.Widgets.Checkbox.prototype */ {

	customWrapperClassName: "als-checkbox-wrapper",

	/** @constructs */
	initialize: function (id, label, callbackObject = undefined, callback = "") {
		L.ALS.Widgets.BaseWidget.prototype.initialize.call(this, "checkbox", id, label, callbackObject, callback, ["change"], {});
		this.setConstructorArguments(arguments);
		this.setValue(false);
	},

	toHtmlElement: function () {
		let container = this.createContainer();
		container.appendChild(this._createInput());
		this.input.className = "hidden";
		this.visualElement = document.createElement("label");
		this.visualElement.htmlFor = this.input.id;
		this.visualElement.className = "ri ri-check-line";
		this.input.parentElement.appendChild(this.visualElement);
		container.appendChild(this.createLabel());
		return container;
	},

	getValue: function () {
		return this.input.checked;
	},

	/**
	 * Sets value of this checkbox
	 * @param value {boolean | "true" | "false"} Value to set
	 */
	setValue: function (value) {
		this.input.checked = value;
	},

	/**
	 * Alias for setValue()
	 * @param isChecked {boolean} Check (true) or uncheck (false) this checkbox
	 */
	setChecked: function (isChecked) {
		this.setValue(isChecked);
	},

	/**
	 * Indicates whether this checkbox is checked or not. Alias for getValue().
	 * @return {*}
	 */
	isChecked: function () {
		return this.getValue();
	},

});