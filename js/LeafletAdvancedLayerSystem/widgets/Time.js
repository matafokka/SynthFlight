const supportsTime = require('time-input-polyfill/supportsTime');
const TimePolyfill = require('time-input-polyfill');

L.ALS.Widgets.Time = L.ALS.Widgets.BaseWidget.extend({

	initialize: function (id, label, objectToControl, callback, attributes) {
		L.ALS.Widgets.BaseWidget.prototype.initialize.call(this, "time", id, label, objectToControl, ["edit", "change"], ["edit", "change"], attributes);
		this.setConstructorArguments(arguments);
		this._waitForElementToBeAdded();
	},

	/**
	 * Waits until widget will be added and applies TimePolyfill
	 * @return {Promise<void>}
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
	},

	getValue: function () {
		if (this.input.polyfill)
			return this.input.getAttribute("data-value");
		return this.input.value;
	}
});