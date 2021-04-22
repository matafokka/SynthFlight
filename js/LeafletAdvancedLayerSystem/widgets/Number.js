/**
 * Number input widget
 *
 * @param id {string} ID of this input. You can select this object using this ID.
 * @param label {string} Label for this input. You can also pass locale property to localize the label.
 * @param callbackObject {Object|L.ALS.Serializable} Object which contains callback. Just pass "this". If you plan to use serialization, this object MUST be instance of L.ALS.Serializable.
 * @param callback {string} Name of the method of callbackObject that will be called when widget's value changes
 * @param attributes {Object} Attributes of an input, such as min, max, etc in format `{attributeName1: attributeValue1, attributeName2: attributeValue2, ...}`
 *
 * @class
 * @extends L.ALS.Widgets.BaseWidget
 */
L.ALS.Widgets.Number = L.ALS.Widgets.BaseWidget.extend( /** @lends L.ALS.Widgets.Number.prototype */ {

	customWrapperClassName: "als-number",

	/** @constructs */
	initialize: function (id, label, callbackObject = undefined, callback = "") {
		L.ALS.Widgets.BaseWidget.prototype.initialize.call(this, "text", id, label, callbackObject, callback, ["edit", "change", "keyup"]);
		this.setConstructorArguments(arguments);

		this.input.addEventListener("keydown", (event) => {
			// If:
			if (!(event.key === "." && this.input.value.indexOf(".") === -1) // 1. Not first comma in the value
				&& !(event.key === "-" && this.input.selectionStart === 0 && this.input.value[0] !== "-") // Not first and only minus
				&& !event.ctrlKey // 2. Ctrl has not been pressed
				&& event.key.length === 1 // 3. Functional button has not been pressed
				&& isNaN(parseInt(event.key)) // 4. Number has not been entered
			)
				event.preventDefault(); // Then don't enter pressed key
		});
	},

	toHtmlElement: function () {
		let container = L.ALS.Widgets.BaseWidget.prototype.toHtmlElement.call(this);
		this.input.inputMode = "decimal";

		let callback = (sign) => {
			if (this.input.disabled)
				return;
			let step = parseFloat(this.input.step);
			let newValue = this.getValue() + sign * ((isNaN(step)) ? 1 : step);
			if (!this._validateValue(newValue))
				return;

			this.setValue(newValue);
			L.ALS.Helpers.dispatchEvent(this.input, "edit");
		}

		let minusButton = document.createElement("div");
		minusButton.className = "als-button-base ri ri-subtract-line";
		minusButton.addEventListener("click", () => { callback(-1); });

		let plusButton = document.createElement("div");
		plusButton.className = "als-button-base ri ri-add-line";
		plusButton.addEventListener("click", () => { callback(1); });

		let wrapper = this.input.parentNode;
		wrapper.appendChild(minusButton);
		wrapper.appendChild(plusButton);

		return container;
	},

	/**
	 * @return {number} Value of this widget
	 */
	getValue: function () {
		return parseFloat(this.input.value);
	},

	/**
	 * Sets value of this widget. If provided value is not valid, will not do anything.
	 * @param value {string|number} Value to set
	 * @return {L.ALS.Widgets.Number} This
	 */
	setValue: function (value) {
		if (this._validateValue(parseFloat(value)))
			this.input.value = value;
		return this;
	},

	onChange: function (event) {
		if (this.input.value === "")
			return false;

		// We should still remove unwanted symbols in case when user pastes something
		let newValue = "", encounteredDot = false;
		for (let symbol of this.input.value) {
			if (!encounteredDot && symbol === ".")
				encounteredDot = true;
			else if (isNaN(parseInt(symbol)))
				continue;
			newValue += symbol;
		}
		if (this.input.value[0] === "-")
			newValue = "-" + newValue;

		let selectionStart = this.input.selectionStart; // Some browsers reset selection when input's value changes programmatically. We need to restore that.
		this.input.value = newValue;
		this.input.setSelectionRange(selectionStart, selectionStart);
		return this._validateValue(parseFloat(this.input.value));
	},

	/**
	 * Validates given value.
	 * @param value {number} Value to validate
	 * @return {boolean} True, if value is valid. False otherwise.
	 * @private
	 */
	_validateValue: function (value) {
		let min = parseFloat(this.input.min);
		let max = parseFloat(this.input.max);
		return !(isNaN(value) || (!isNaN(min) && value < min) || (!isNaN(max) && value > max))
	},

	/**
	 * Sets input's constraint (property) such as min, max and step
	 * @param name {string} Constraint (property) name
	 * @param value {number} Constraint (property) value. Pass undefined to remove a constraint.
	 * @return {L.ALS.Widgets.Number} This
	 * @private
	 */
	_setConstraint: function (name, value) {
		value = (value === undefined) ? "" : value;
		this.input[name] = value;
		return this;
	},

	/**
	 * Finds constraint set to this widget
	 * @param name {string} Constraint (property) name
	 * @return {number|NaN} A constraint value or NaN if no constraint has been set
	 * @private
	 */
	_getConstraint: function (name) {
		return parseFloat(this.input[name]);
	},

	/**
	 * Sets minimum value of this widget
	 * @param min {number} Minimum value to set. Pass undefined to remove this constraint.
	 * @return {L.ALS.Widgets.Number} This
	 */
	setMin: function (min) {
		return this._setConstraint("min", min);
	},

	/**
	 * @return {number|NaN} Minimum value of this widget or NaN if no value has been set
	 */
	getMin: function () {
		return this._getConstraint("min");
	},

	/**
	 * Sets maximum value of this widget
	 * @param max {number} Maximum value to set. Pass undefined to remove this constraint.
	 * @return {L.ALS.Widgets.Number} This
	 */
	setMax: function (max) {
		return this._setConstraint("max", max);
	},

	/**
	 * @return {number|NaN} Maximum value of this widget or NaN if no value has been set
	 */
	getMax: function () {
		return this._getConstraint("max");
	},

	/**
	 * Sets step of this widget, i.e. number that will be added/subtracted from the current value when user presses minus/plus button
	 * @param step {number} Step to set. Pass undefined to remove the step.
	 * @return {L.ALS.Widgets.Number} This
	 */
	setStep: function (step) {
		return this._setConstraint("step", step);
	},

	/**
	 * @return {number|NaN} Step of this widget or NaN if no value has been set
	 */
	getStep: function () {
		return this._getConstraint("step");
	},

});