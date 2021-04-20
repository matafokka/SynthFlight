/**
 * A button. Always takes up the whole width of the container.
 */
L.ALS.Widgets.Button = L.ALS.Widgets.BaseWidget.extend({

	customWrapperClassName: "als-buttons-wrapper",
	undoable: false,

	/**
	 * Constructs the button
	 * @param id {string} ID of this input. You can select this object using this ID.
	 * @param text {string} Text for the button. You can also pass locale property to localize the text.
	 * @param objectToControl {Object|L.ALS.Serializable} Just pass "this". If you plan to use serialization, this object MUST be instance of L.ALS.Serializable.
	 * @param callback {string} Name of a method of objectToControl that will be called when button will be pressed.
	 * @param mobileIcon {string} class appended to this button if user's device is a phone. Can be used for setting an icon instead of text to save up space and avoid word wrapping. You can use Remix Icon classes to do so. Or you can install your own icon pack (not recommended due to inconsistency) and use it this way.
	 */
	initialize: function (id, text, objectToControl = undefined, callback = "", mobileIcon = "") {
		this._mobileIcon = mobileIcon;
		L.ALS.Widgets.BaseWidget.prototype.initialize.call(this, "", id, "", objectToControl, callback, ["click"], {});
		this.setButtonText(text);
		this.setConstructorArguments(arguments);
	},

	toHtmlElement: function () {
		let container = this.createContainer();
		container.appendChild(this._createInput());
		return container;
	},

	createInputElement: function () {
		let button = document.createElement("div");
		button.className = "als-button-base";
		if (this._mobileIcon !== "") {
			button.setAttribute("data-mobile-class", "ri " + this._mobileIcon);
			this._waitForElementToBeAdded();
		}
		return button;
	},

	/**
	 * Sets button text
	 * @param text {string} text to set. Can be a locale property.
	 */
	setButtonText: function (text) {
		L.ALS.Locales.localizeOrSetValue(this.input, text);
	},

	/**
	 * @return {string} Button text
	 */
	getButtonText: function () {
		return L.ALS.Locales.getLocalePropertyOrValue(this.input);
	},

	_waitForElementToBeAdded: async function () {
		while (!this.container || this.container.parentNode === null)
			await new Promise(resolve => setTimeout(resolve, 0)); // Infinite loop hangs the script. Timeout prevents it.
		L.ALS.Helpers._applyButtonsIconsIfMobile(this.container);
	},

	getValue: function () {},
	setValue: function () {},

})