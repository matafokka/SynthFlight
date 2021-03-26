/**
 * Contains helper methods and properties
 */
L.ALS.Helpers = {
	/**
	 * Dispatches event of given type to given object.
	 * @param object {Object} Object to dispatch event to
	 * @param type {string} Type of event
	 * @public
	 */
	dispatchEvent: function (object, type) {
		let event = document.createEvent("Event");
		event.initEvent(type, true, true);
		object.dispatchEvent(event);
	},

	/**
	 * Formats number to more readable format by inserting spaces
	 * @param number {number | string} Number to format
	 * @return {string} Formatted number
	 */
	formatNumber: function (number) {
		let numberString = number.toString();
		let finalString = "", fraction = "", repeats = 0;
		for (let i = numberString.length - 1; i >= 0; i--) {
			let symbol = numberString[i];

			if (symbol === ".") {
				finalString = "." + fraction;
				repeats = 0;
				continue;
			}

			if (repeats === 3) {
				finalString = " " + finalString;
				repeats = 0;
			}

			finalString = symbol + finalString;
			fraction = symbol + fraction;
			repeats++;
		}
		return finalString;
	},

	/**
	 * Generates random and unique ID
	 * @return {string} Generated ID
	 */
	generateID: function () {
		return "_" + Math.random() + "_" + Date.now();
	},

	/**
	 * Checks if given object is empty
	 * @param object {Object} Object to check
	 * @return {boolean} True, if object is empty. False otherwise.
	 */
	isObjectEmpty: function (object) {
		for (let prop in object) {
			if (object.hasOwnProperty(prop))
				return false;
		}
		return true;
	},

	/**
	 * Merges two options into one object without modifying them. It checks if property is present in the `defaultOptions`, `defaultOptions` should contain ALL the needed properties.
	 * @param defaultOptions {Object} Object containing all default options
	 * @param newOptions {Object} Options passed by the user
	 * @return {Object} Object containing merged properties of two given objects
	 */
	mergeOptions: function (defaultOptions, newOptions) {
		let resultingOptions = {};
		for (let obj of [defaultOptions, newOptions]) {
			for (let prop in obj) {
				if (obj.hasOwnProperty(prop) && defaultOptions.hasOwnProperty(prop))
					resultingOptions[prop] = obj[prop];
			}
		}
		return resultingOptions;
	},

	/**
	 * Finds extension of the given filename, i.e. part after last dot.
	 * @param filename {string} Filaname
	 * @return {string} Extension
	 */
	getFileExtension: function (filename) {
		let ext = "";
		for (let i = filename.length; i <= 0; i--) {
			let symbol = filename[i];
			if (symbol === ".")
				break;
			ext = symbol + ext;
		}
		return ext;
	},

	/**
	 * Makes button hide or show element on click. Both button and element will have attribute "data-hidden" equal to 0 or 1.
	 * @param button {HTMLElement} Button that will control visibility of the element.
	 * @param element {HTMLElement} Element that will be controlled
	 * @param onHideCallback {function} Function to call on hiding
	 * @param onShowCallback {function} Function to call on showing
	 * @param clickAfter {boolean} If set to true, button will be clicked after all the things will be applied. You may want to set it to false if your callbacks affects unfinished stuff.
	 * @private
	 */
	makeHideable: function (button, element = undefined, onHideCallback = undefined, onShowCallback = undefined, clickAfter = true) {
		let dataHidden = "data-hidden";
		let e = element === undefined ? button : element;

		if (!e.hasAttribute(dataHidden))
			e.setAttribute(dataHidden, "1");

		button.addEventListener("click", function () {
			let newValue, callback;
			if (e.getAttribute(dataHidden) === "1") {
				newValue = "0";
				callback = onHideCallback;
			} else {
				newValue = "1";
				callback = onShowCallback;
			}
			e.setAttribute(dataHidden, newValue);

			if (callback !== undefined)
				callback();
		});
		if (clickAfter)
			L.ALS.Helpers.dispatchEvent(button, "click");
	},

	/**
	 * Parses given HTML and appends it to given element as a child
	 * @param html {string} HTML to parse
	 * @param appendTo {Element} Element to append parsed HTML to
	 * @constructor
	 */
	HTMLToElement: function (html, appendTo = document.body) {
		let parsedDom = document.implementation.createHTMLDocument("title");
		parsedDom.body.innerHTML += html;
		while (parsedDom.body.hasChildNodes()) {
			appendTo.appendChild(parsedDom.body.firstChild.cloneNode(true));
			parsedDom.body.removeChild(parsedDom.body.firstChild);
		}
	},

	/**
	 * @type {"desktop"|"phone"|"tablet"}
	 * Contains user's device type. This detection has been performed using only user agent. If you want to implement something that relies on actual device type, consider performing feature detection by yourself. Otherwise, use this property to maintain consistent look and feel.
	 */
	deviceType: "desktop",

	/**
	 * @type {boolean}
	 * Equals to `deviceType === "phone"`
	 */
	isMobile: true,

	/**
	 * @type {boolean}
	 * If user's browser is IE9 or less, will be equal to true. Will be equal to false otherwise.
	 */
	isIElte9: window.ActiveXObject && !window.navigator.msSaveOrOpenBlob,
}

/**
 * If user's browser doesn't support Data URLs (URLs in form: `data:[<mediatype>][;base64],<data>`), this will true. Otherwise will be false.
 * @type {boolean}
 */
L.ALS.Helpers.supportsDataURL = !!(!L.ALS.Helpers.isIElte9 && ((window.URL && window.URL.createObjectURL) || (window.webkitURL && window.webkitURL.createObjectURL)));

// Detect user browser
let ua = window.navigator.userAgent.toLowerCase();
let mobiles = ["android", "iphone", "ipod", "opera mini", "windows phone", "bb", "blackberry"];
let tablets = ["tablet", "ipad", "playbook", "silk"];
let devices = [mobiles, tablets];
let isTablet = false;
for (let device of devices) {
	for (let string of device) {
		if (ua.indexOf(string) !== -1) {
			L.ALS.Helpers.deviceType = isTablet ? "tablet" : "phone";
			break;
		}
	}
	isTablet = true;
}
L.ALS.Helpers.isMobile = (L.ALS.Helpers.deviceType === "phone");