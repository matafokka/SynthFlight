/**
 * Checkbox widget. Unchecked by default.
 */
L.ALS.Widgets.Checkbox = L.ALS.Widgets.BaseWidget.extend({

	customWrapperClassName: "als-checkbox-wrapper",

	initialize: function (id, label, objectToControl = undefined, callback = "") {
		L.ALS.Widgets.BaseWidget.prototype.initialize.call(this, "checkbox", id, label, objectToControl, callback, ["change"], {});
		this.setConstructorArguments(arguments);
		this.setValue(false);
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
		this.setChecked(isChecked);
	},

	/**
	 * Indicates whether this checkbox is checked or not. Alias for getValue().
	 * @return {*}
	 */
	isChecked: function () {
		return this.getValue();
	}

});