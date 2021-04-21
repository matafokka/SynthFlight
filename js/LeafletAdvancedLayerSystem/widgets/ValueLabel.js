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
 *
 * @param id {string} ID of this label
 * @param description {string} Value description. You can use locale property to localize it.
 * @param units {string} Units for this label. If set to empty string, unitsPosition won't take an effect.
 * @param unitsPosition {"description"|"value"} Units position. If set to "description", units will be displayed after description. Otherwise, units will be displayed after the value.
 * @param formatNumbers {boolean} If set to true, value will be formatted using L.ALS.Helpers.formatNumber()
 * @param style {"nostyle"|"message"|"success"|"warning"|"error"} Style of this label
 * @param initialValue {string} Initial value of this label
 *
 * @class
 * @extends L.ALS.Widgets.SimpleLabel
 */
L.ALS.Widgets.ValueLabel = L.ALS.Widgets.SimpleLabel.extend( /** @lends L.ALS.Widgets.ValueLabel.prototype */ {

	undoable: false,

	/** @constructs */
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

	/**
	 * Sets description of this label
	 * @param description {string} Value description. You can use locale property to localize it.
	 */
	setDescription: function (description) {
		/**
		 * Description of this label
		 * @type {string}
		 * @private
		 */
		this._description = description;
		this._updateValue();
	},

	/**
	 * @return {string} Description of this label
	 */
	getDescription: function () {
		return this._description;
	},

	/**
	 * Sets whether this label will automatically format numbers using L.ALS.Helpers.formatNumber()
	 * @param formatNumbers {boolean} If true, this label will automatically format numbers.
	 */
	setFormatNumbers: function (formatNumbers) {
		/**
		 * Defines whether this label should format numbers
		 * @type {boolean}
		 * @private
		 */
		this._formatNumbers = formatNumbers;
		this._updateValue();
	},

	/**
	 * @return {boolean} If true, this label automatically formats numbers.
	 */
	getFormatNumbers: function () {
		return this._formatNumbers;
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

	/**
	 * Sets units for this label
	 * @param units {string} Units to set
	 */
	setUnits: function (units) {
		/**
		 * Units set to this label
		 * @type {string}
		 * @private
		 */
		this._units = units;
		this._updateValue();
	},

	/**
	 * @return {string} Units set to this label
	 */
	getUnits: function () {
		return this._units;
	},

	/**
	 * Sets units position.
	 * @param position  {"description"|"value"} Units position. If set to "description", units will be displayed after description. Otherwise, units will be displayed after the value.
	 */
	setUnitsPosition: function (position) {
		/**
		 * Units' position set to this lable
		 * @type {"description"|"value"}
		 * @private
		 */
		this._unitsPosition = position;
		this._updateValue();
	},

	/**
	 * @return {"description"|"value"} Units position of this label
	 */
	getUnitsPosition: function () {
		return this._unitsPosition;
	},

	/**
	 * Updates actual value of this label
	 * @private
	 */
	_updateValue: function () {
		let hasUnits = this._units !== "";
		let isDescription = this._unitsPosition === "description";
		let localizedValue = L.ALS.locale[this._description];
		let value = (localizedValue) ? localizedValue : this._description;
		if (isDescription && hasUnits)
			value += " (" + this._units + ")";
		value += ": " + (this._formatNumbers ? L.ALS.Helpers.formatNumber(this._labelValue) : this._labelValue);
		if (!isDescription && hasUnits)
			value += " " + this._units;
		L.ALS.Widgets.SimpleLabel.prototype.setValue.call(this, value);
	},

	/**
	 * @return {string} Whole text of this label, i.e. result of SimpleLabel.getValue()
	 */
	getActualValue: function () {
		return L.ALS.Widgets.SimpleLabel.prototype.getValue.call(this);
	}

});