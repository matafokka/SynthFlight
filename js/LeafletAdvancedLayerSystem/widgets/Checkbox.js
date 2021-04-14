/**
 * Checkbox widget. Unchecked by default.
 */
L.ALS.Widgets.Checkbox = L.ALS.Widgets.BaseWidget.extend({

	customWrapperClassName: "als-checkbox-wrapper",

	initialize: function (id, label, objectToControl = undefined, callback = "") {
		L.ALS.Widgets.BaseWidget.prototype.initialize.call(this, "checkbox", id, label, objectToControl, callback, ["change"], {});
		this.setConstructorArguments(arguments);
		this.setValue(false);

		// Build checkbox
		this.input.className = "hidden";
		this.visualElement = document.createElement("label");
		this.visualElement.htmlFor = this.input.id;
		this.visualElement.className = "als-button-base ri";
		this.input.parentElement.appendChild(this.visualElement);

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
		this._updateVisualElement();
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

	callCallback: function () {
		this._updateVisualElement();
		L.ALS.Widgets.BaseWidget.prototype.callCallback.call(this);
	},

	_updateVisualElement: function () {
		if (!this.visualElement) // setValue() is being called at parent's constructor, so we gotta create this check
			return;
		if (this.input.checked)
			this.visualElement.classList.add("ri-check-line");
		else
			this.visualElement.classList.remove("ri-check-line");
	}

});