const supportsTime = require('time-input-polyfill/supportsTime');
const TimePolyfill = require('time-input-polyfill');

/**
 * Time input widget
 *
 * @param id {string} ID of this input. You can select this object using this ID.
 * @param label {string} Label for this input. You can also pass locale property to localize the label.
 * @param callbackObject {Object|L.ALS.Serializable} Object which contains callback. Just pass "this". If you plan to use serialization, this object MUST be instance of L.ALS.Serializable.
 * @param callback {string} Name of the method of callbackObject that will be called when widget's value changes
 *
 * @class
 * @extends L.ALS.Widgets.BaseWidget
 */
L.ALS.Widgets.Time = L.ALS.Widgets.BaseWidget.extend( /** @lends L.ALS.Widgets.Time.prototype */ {

	initialize: function (id, label, callbackObject, callback) {
		L.ALS.Widgets.BaseWidget.prototype.initialize.call(this, "time", id, label, callbackObject, ["edit", "change"], ["edit", "change"]);
		this.setConstructorArguments(arguments);
		this._waitForElementToBeAdded();
	},

	/**
	 * Waits until widget will be added and applies TimePolyfill
	 * @return {VoidFunction}
	 * @private
	 */
	_waitForElementToBeAdded: async function () {
		if (supportsTime)
			return;
		while (this.container.parentNode === null)
			await new Promise(resolve => setTimeout(resolve, 0)); // Infinite loop hangs the script. Timeout prevents it.
		new TimePolyfill(this.input);
	},

	setValue: function (value) {
		L.ALS.Widgets.BaseWidget.prototype.setValue.call(this, value)
		if (this.input.polyfill)
			this.input.polyfill.update();
		return this;
	},

	getValue: function () {
		if (this.input.polyfill)
			return this.input.getAttribute("data-value");
		return this.input.value;
	}
});