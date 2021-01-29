require("jscolor");

L.ALS.Widgets.Color = L.ALS.Widgets.BaseWidget.extend({

	initialize: function (id, label, objectToControl, callback, attributes) {
		L.ALS.Widgets.BaseWidget.prototype.initialize.call(this, "color", id, label, objectToControl, callback, ["edit", "change"], attributes);
		this._waitForElementToBeAdded();
	},

	/**
	 * Sets value of this widget
	 * @param value {string} Color in format that CSS can read
	 */
	setValue: function (value) {
		L.ALS.Widgets.BaseWidget.prototype.setValue.call(this, value);
		if (this.input.jscolor)
			this.input.jscolor.fromString(value);
	},

	/**
	 * Waits until widget will be added and applies JSColor
	 * @return {Promise<void>}
	 * @private
	 */
	_waitForElementToBeAdded: async function () {
		while (this.container.parentNode === null)
			await new Promise(resolve => setTimeout(resolve, 0)); // Infinite loop hangs the script. Timeout prevents it.

		let previousValue = this.input.value;
		let supportsColor = false; // Detect if browser supports color input
		try {
			this.input.value = "!";
			supportsColor = (this.input.type === "color" && this.input.value !== "!");
		} catch (e) {}
		this.input.value = previousValue;

		if (!supportsColor) {
			new JSColor(this.input, {
				borderRadius: 0,
				padding: 3,
				shadow: false,
				hash: true
			});
		}
	},
});