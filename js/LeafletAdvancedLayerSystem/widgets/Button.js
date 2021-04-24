/**
 * A button. Always takes up the whole width of the container.
 *
 * @class
 * @extends L.ALS.Widgets.BaseWidget
 *
 * @param id {string} ID of this input. You can select this object using this ID.
 * @param text {string} Text for the button. You can also pass locale property to localize the text.
 * @param callbackObject {Object|L.ALS.Serializable} Just pass "this". If you plan to use serialization, this object MUST be instance of L.ALS.Serializable.
 * @param callback {string} Name of a method of callbackObject that will be called when button will be pressed.
 */
L.ALS.Widgets.Button = L.ALS.Widgets.BaseWidget.extend( /** @lends L.ALS.Widgets.Button.prototype */ {

	customWrapperClassName: "als-buttons-wrapper",
	undoable: false,

	initialize: function (id, text, callbackObject = undefined, callback = "") {
		L.ALS.Widgets.BaseWidget.prototype.initialize.call(this, "", id, "", callbackObject, callback, ["click"]);
		this.setButtonText(text);
		this.setConstructorArguments(arguments);
	},

	toHtmlElement: function () {
		let container = this.createContainer();
		container.appendChild(this.createInput());
		return container;
	},

	createInputElement: function () {
		let button = document.createElement("div");
		button.className = "als-button-base";
		return button;
	},

	/**
	 * Sets button text
	 * @param text {string} text to set. Can be a locale property.
	 * @return {L.ALS.Widgets.Button} This
	 */
	setButtonText: function (text) {
		L.ALS.Locales.localizeOrSetValue(this.input, text);
		return this;
	},

	/**
	 * @return {string} Button text
	 */
	getButtonText: function () {
		return L.ALS.Locales.getLocalePropertyOrValue(this.input);
	},

	/**
	 * Waits for button to be added and applies mobile icon
	 * @return {VoidFunction}
	 * @private
	 */
	_waitForElementToBeAdded: async function () {
		while (!this.container || this.container.parentNode === null)
			await new Promise(resolve => setTimeout(resolve, 0)); // Infinite loop hangs the script. Timeout prevents it.
		L.ALS.Helpers._applyButtonsIconsIfMobile(this.container);
	},

	/**
	 * Sets mobile icon - a class appended to this button if user's device is a phone.
	 *
	 * Can be used for setting an icon instead of text to save up space and avoid word wrapping.
	 *
	 * You can use Remix Icon classes to do so. Or you can install your own icon pack (not recommended due to inconsistency) and use it this way.
	 *
	 * To remove a mobile icon, pass an empty string.
	 *
	 * @param mobileIcon {string} Icon to set
	 * @return {L.ALS.Widgets.Button} This
	 */
	setMobileIcon: function (mobileIcon) {
		if (mobileIcon === "") {
			this.input.removeAttribute("data-mobile-class")
			return this;
		}
		this.input.setAttribute("data-mobile-class", "ri " + mobileIcon);
		this._waitForElementToBeAdded();
		return this;
	},

	/**
	 * @return {string} Mobile icon of this button. If no mobile icon has been set, returns empty string.
	 */
	getMobileIcon: function () {
		let icon = this.input.getAttribute("data-mobile-class");
		if (!icon)
			return "";
		return icon;
	},

	/**
	 * Alias for {@link L.ALS.Widgets.Button#getButtonText}
	 * @return {string} Button's text
	 */
	getValue: function () {
		return this.getButtonText();
	},

	/**
	 * Alias for {@link L.ALS.Widgets.Button#setButtonText}
	 * @param value {string} Text to set
	 * @return {L.ALS.Widgets.Button} This
	 */
	setValue: function (value) {
		return this.setButtonText(value);
	},

})