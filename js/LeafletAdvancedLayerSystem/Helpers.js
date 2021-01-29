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
	 * @type {"desktop"|"phone"|"tablet"}
	 * Contains user's device type
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

// If user's device is a phone, make UI a bit bigger
L.ALS.Helpers.isMobile = (L.ALS.Helpers.deviceType === "phone");
if (L.ALS.Helpers.isMobile)
	document.querySelector(":root").style.fontSize = "36pt";
