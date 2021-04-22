const JSZip = require("jszip");
const saveAs = require("file-saver");

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
	 * @param button {Element} Button that will control visibility of the element.
	 * @param element {Element} Element that will be controlled
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
				callback = onShowCallback;
			} else {
				newValue = "1";
				callback = onHideCallback;
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
	 * Reads file opened on fileInput as text, calls given callback and passes text to it
	 * @param fileInput {HTMLElement} File input to read file from
	 * @param notSupportedNotification {string} If user's browser doesn't support reading text files, this notification will be presented.
	 * @param callback {function(string)} Callback to pass text to
	 */
	readTextFile: function (fileInput, notSupportedNotification, callback) {
		if (!window.FileReader && !L.ALS.Helpers.isIElte9) { // "!FileReader" throws exception in IE9
			window.alert(notSupportedNotification);
			fileInput.value = "";
			return;
		}

		if (L.ALS.Helpers.isIElte9) {
			let fso = new ActiveXObject("Scripting.FileHelpersObject");
			let file = fso.openTextFile(fileInput.value);
			let content = file.readAll();
			file.close();
			callback(content);
			fileInput.value = "";
			return;
		}

		let fileReader = new FileReader();
		fileReader.onloadend = () => {
			callback(fileReader.result);
			fileInput.value = "";
		}
		fileReader.readAsText(fileInput.files[0]);
	},

	/**
	 * Displayes notification if Data URL is not supported
	 * @param extension {string} file extension to display in notification
	 */
	notifyIfDataURLIsNotSupported: function (extension = "geojson") {
		if (L.ALS.Helpers.supportsDataURL)
			return;

		let firstLine;
		if (L.ALS.Helpers.isIElte9) {
			firstLine = "Please, download all the files"
			if (extension !== "")
				firstLine += " and manually set their extensions to \"" + extension + "\"";
		} else {
			firstLine = "Please, manually save text form all tabs that will open ";
			if (extension === "")
				firstLine += "after you'll close this window";
			else
				firstLine += "to \"" + extension + "\" files.";
		}
		window.alert(firstLine + "\n" + L.ALS.Helpers._inconvenienceText);
	},

	/**
	 * Downloads data by creating data URL.
	 * @param filename {string} Name of the file to save
	 * @param mediatype {string} Data URL media type
	 * @param encoding {string} Data or text encoding
	 * @param data {string} Data itself
	 * @param notifyIfCantKeepExtension {boolean} If user's browser can't keep extension, notify them about it
	 */
	createDataURL: function (filename, mediatype, encoding, data, notifyIfCantKeepExtension = true) {
		let link = document.createElement("a");
		if (!link.download && notifyIfCantKeepExtension) {
			let ext = L.ALS.Helpers.getFileExtension(filename);
			if (ext.length !== 0)
				window.alert("Please, manually change extension of the downloaded file to \"" + ext + "\".\n" + L.ALS.Helpers._inconvenienceText);
		}
		link.download = filename;
		link.href = "data:" + mediatype + ";" + encoding + "," + data;
		if (link.click)
			link.click();
		else // link.click() is not implemented in some older browsers
			L.ALS.Helpers.dispatchEvent(link, "click");
	},

	/**
	 * Saves string as text
	 * @param string {string} String to save
	 * @param filename {string} Name of the file to save
	 */
	saveAsText: function (string, filename) {
		if (L.ALS.Helpers.supportsBlob) {
			saveAs(new Blob([string], {type: 'text/plain'}), filename);
			return;
		}
		if (L.ALS.Helpers.supportsDataURL) {
			this.createDataURL(filename, "text/plain", "base64",
				// Taken from https://attacomsian.com/blog/javascript-base64-encode-decode
				btoa(encodeURIComponent(string).replace(/%([0-9A-F]{2})/g,
					function (match, p1) {
						return String.fromCharCode("0x" + p1);
					})), false);
			return;
		}

		if (!L.ALS.Helpers.isIElte9)
			this.notifyIfDataURLIsNotSupported(L.ALS.Helpers.getFileExtension(filename));

		// Chrome 7 and IE9
		let fileWindow = window.open("", "_blank");
		fileWindow.document.open('text/plain');
		fileWindow.document.write(string);
		if (L.ALS.Helpers.isIElte9) {
			fileWindow.document.execCommand('SaveAs', true, filename + ".txt");
			fileWindow.close();
		}
	},

	_applyButtonsIconsIfMobile: function (container) {
		if (!this.isMobile)
			return;
		container.classList.add("als-icon-button-container");
		let children = container.querySelectorAll("*[data-mobile-class]");
		for (let el of children) {
			el.className += " " + el.getAttribute("data-mobile-class");
			el[L.ALS.Locales._getElementPropertyToSet(el)] = "";
			el.removeAttribute("data-als-locale-property");
		}
	},

	_inconvenienceText: "Sorry for the inconvenience. Please, update your browser, so this and many other things on the web won't happen.\n\nYour download will start after you'll close this window.",

	/**
	 * Indicates whether user's browser supports Blob or not
	 */
	supportsBlob: !!(JSZip.support.blob && (!window.webkitURL || (window.URL && window.URL.createObjectURL))),

	/**
	 * @type {"desktop"|"phone"|"tablet"}
	 * Contains user's device type. This detection has been performed using only user agent. If you want to implement something that relies on actual device type, consider performing feature detection by yourself. Otherwise, use this property to maintain consistent look and feel.
	 */
	deviceType: "desktop",

	/**
	 * Equals to `deviceType === "phone"`
	 * @type {boolean}
	 */
	isMobile: true,

	/**
	 * If user's browser is IE (any version), will be true. Will be false otherwise.
	 */
	isIE: "ActiveXObject" in window,

	/**
	 * If user's browser is IE9 or less, will be true. Will be false otherwise.
	 * @type {boolean}
	 */
	isIElte9: window.ActiveXObject && !window.navigator.msSaveOrOpenBlob,

	/**
	 * If user's browser is IE11, will be true. Will be false otherwise.
	 * @type {boolean}
	 */
	isIE11: !(window.ActiveXObject) && "ActiveXObject" in window,

	/**
	 * If user's browser supports flexbox, will be set to true. Will be false otherwise.
	 * @type {boolean}
	 */
	supportsFlexbox: true,

	/**
	 * If user's browser is Chrome, will be set to true. Will be false otherwise.
	 * @type {boolean}
	 */
	isChrome: !!window.chrome,

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
document.body.classList.add((L.ALS.Helpers.isMobile) ? "mobile" : "not-mobile");

// Detect flexbox support
let p = document.createElement("p");
p.style.display = "flex";
if (p.style.display !== "flex")
	L.ALS.Helpers.supportsFlexbox = false;

// Fix font size on mobile devices
let meta = document.createElement("meta");
meta.name = "viewport";
meta.content = "width=device-width, initial-scale=1.0";
document.head.appendChild(meta);

/**
 * By default, points to window.localStorage. If user's browser doesn't support LocalStorage, will use temporary "polyfill" which acts like LocalStorage but doesn't actually save anything.
 */
L.ALS.Helpers.localStorage = (!!window.localStorage) ? window.localStorage : {

	_storage: {},

	getItem(key) {
		return this._storage[key];
	},

	setItem(key, value) {
		this._storage[key] = value;
	},

	removeItem(key) {
		delete this._storage[key];
	},

	clear() {
		this._storage = {};
	}
}