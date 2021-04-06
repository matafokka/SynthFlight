L.ALS.Widgets.Number = L.ALS.Widgets.BaseWidget.extend({

	customWrapperClassName: "adv-lyr-sys-number",

	initialize: function (id, label, objectToControl = undefined, callback = "", attributes = {}) {
		L.ALS.Widgets.BaseWidget.prototype.initialize.call(this, "text", id, label, objectToControl, callback, ["edit", "change", "keyup"], attributes);
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
		minusButton.className = "button-base las la-minus";
		minusButton.addEventListener("click", () => { callback(-1); });

		let plusButton = document.createElement("div");
		plusButton.className = "button-base las la-plus";
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
	 */
	setValue: function (value) {
		if (this._validateValue(parseFloat(value)))
			this.input.value = value;
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
		let min = parseFloat(this.input.getAttribute("min"));
		let max = parseFloat(this.input.getAttribute("max"));
		return !(isNaN(value) || (!isNaN(min) && value < min) || (!isNaN(max) && value > max))
	}

});