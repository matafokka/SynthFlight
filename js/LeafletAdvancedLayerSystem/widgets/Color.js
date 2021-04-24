require("jscolor");
const debounce = require("debounce");

/**
 * Color input widget
 *
 * @param id {string} ID of this input. You can select this object using this ID.
 * @param label {string} Label for this input. You can also pass locale property to localize the label.
 * @param callbackObject {Object|L.ALS.Serializable} Object which contains callback. Just pass "this". If you plan to use serialization, this object MUST be instance of L.ALS.Serializable.
 * @param callback {string} Name of the method of callbackObject that will be called when widget's value changes
 *
 * @class
 * @extends L.ALS.Widgets.BaseWidget
 */
L.ALS.Widgets.Color = L.ALS.Widgets.BaseWidget.extend( /** @lends L.ALS.Widgets.Color.prototype */ {

	initialize: function (id, label, callbackObject = undefined, callback = "") {
		L.ALS.Widgets.BaseWidget.prototype.initialize.call(this, "color", id, label, callbackObject, callback, ["change"]);
		this.setConstructorArguments(arguments);

		this.input.addEventListener("input", debounce(
			() => { this.callCallback(); },
			50));
		this._waitForElementToBeAdded();
	},

	/**
	 * Sets value of this widget
	 * @param value {string} Color in format that CSS can read
	 * @return {L.ALS.Widgets.Color} This
	 */
	setValue: function (value) {
		L.ALS.Widgets.BaseWidget.prototype.setValue.call(this, value);
		if (this.input.jscolor)
			this.input.jscolor.fromString(value);
		return this;
	},

	/**
	 * Waits until widget will be added and applies JSColor
	 * @return {VoidFunction}
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