/**
 * Label that displays value description, value itself and measurement units.
 *
 * For example, when given "Wall width" as description, "10" as value and "m" as measurement units, it will output text like:
 *
 * `Wall width: 10 m` - when unitsPosition set to "value"
 *
 * or
 *
 * `Wall width (m): 10` - When unitsPosition set to "description"
 */
L.ALS.Widgets.ValueLabel = L.ALS.Widgets.SimpleLabel.extend({

	undoable: false,

	/**
	 * Constructs label with value
	 * @param id {string} ID of this label
	 * @param description {string} Value description
	 * @param units {string} Units for this label. If set to empty string, unitsPosition won't take an effect.
	 * @param unitsPosition {"description"|"value"} Units position. If set to "description", units will be displayed after description. Otherwise, units will be displayed after the value.
	 * @param formatNumbers {boolean} If set to true, value will be formatted using L.ALS.Helpers.formatNumber()
	 * @param style {"nostyle"|"message"|"success"|"warning"|"error"} Style of this label
	 * @param initialValue {string} Initial value of this label
	 */
	initialize: function (id, description, units = "", unitsPosition = "description", formatNumbers = false, style="nostyle", initialValue = "") {
		L.ALS.Widgets.SimpleLabel.prototype.initialize.call(this, id, "");
		this.setConstructorArguments(arguments);
		this.setDescription(description);
		this.setFormatNumbers(formatNumbers);
		this.setValue(initialValue);
		this.setUnits(units);
		this.setUnitsPosition(unitsPosition);
		this.setStyle(style);
	},

	setDescription: function (description) {
		this.description = description;
		this._updateValue();
	},

	getDescription: function () {
		return this.description;
	},

	/**
	 * Sets whether this label will automatically format numbers using L.ALS.Helpers.formatNumber()
	 * @param formatNumbers {boolean} If true, this label will automatically format numbers.
	 */
	setFormatNumbers: function (formatNumbers) {
		this.formatNumbers = formatNumbers;
		this._updateValue();
	},

	/**
	 * @return {boolean} If true, this label automatically formats numbers.
	 */
	getFormatNumbers: function () {
		return this.formatNumbers;
	},

	/**
	 * Sets value of this label. It's not an alias for SimpleLabel.setValue()! There's no alias for this method.
	 * @param value Value to set
	 */
	setValue: function (value) {
		this._labelValue = value;
		this._updateValue();
	},

	/**
	 *
	 * @return Value of this label. It doesn't return the whole text! To get whole text, use getActualValue().
	 */
	getValue: function () {
		return this._labelValue;
	},

	setUnits: function (units) {
		this.units = units;
		this._updateValue();
	},

	getUnits: function () {
		return this.units;
	},

	/**
	 * Sets units position.
	 * @param position  {"description"|"value"} Units position. If set to "description", units will be displayed after description. Otherwise, units will be displayed after the value.
	 */
	setUnitsPosition: function (position) {
		this.unitsPosition = position;
		this._updateValue();
	},

	/**
	 * @return {"description"|"value"} Units position of this label
	 */
	getUnitsPosition: function () {
		return this.unitsPosition;
	},

	/**
	 * Updates actual value of this label
	 * @private
	 */
	_updateValue: function () {
		let hasUnits = this.units !== "";
		let isDescription = this.unitsPosition === "description";
		let value = this.description;
		if (isDescription && hasUnits)
			value += " (" + this.units + ")";
		value += ": " + (this.formatNumbers ? L.ALS.Helpers.formatNumber(this._labelValue) : this._labelValue);
		if (!isDescription && hasUnits)
			value += " " + this.units;
		L.ALS.Widgets.SimpleLabel.prototype.setValue.call(this, value);
	},

	/**
	 * @return {string} Whole text of this label, i.e. result of SimpleLabel.getValue()
	 */
	getActualValue: function () {
		return this.value;
	}

});