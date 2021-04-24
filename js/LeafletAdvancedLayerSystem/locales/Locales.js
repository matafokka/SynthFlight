/**
 * Contains locales. You can extend locales by using {L.ALS.Locales.addLocaleProperties} method.
 *
 * Structure is following:
 * ```
 * {
 *     "locale name that will be presented to the user, i.e. 'English'": {
 *         key1: "Value 1", // These keys will be used in app itself. We'll call those "locale properties" for the rest of the documentation.
 *         key2: "Value 2",
 *         ...
 *     },
 *
 *     "Русский": {
 *         "key1": "Значение 1",
 *         "key2": "Значение 2",
 *         ...
 *     },
 *     ...
 * }
 * ```
 *
 * To localize elements created by strings or JSX, put these attributes to localizable elements:
 *
 * ```
 * data-als-locale-property="property in L.ALS.locale" -- Value points to property in L.ALS.Locale.
 *
 * data-als-locale-property-to-localize="text" -- Value says which element's property to localize. This attribute is optional.
 * ```
 *
 * You can also use these properties to additionally alter element's value, for example, add a value to a label.
 *
 *
 * Usage note: You must put all your custom locale's properties to {@link L.ALS.English}. If you don't care about English localization, just copy all your properties to it.
 *
 * @example Create two localized labels for a couple of widgets and localized about section
 *
 * // Prepare locales
 *
 * // Require System and all additional locales except English before doing anything.
 * require("./path/to/ALS/System.js");
 * require("./path/to/ALS/locales/Russian.js");
 *
 * // Define custom locale properties for English. You can do this in external script and require it instead of doing everything at your entry point.
 * L.ALS.Locales.addLocaleProperties("English", {
 *     labelForNumberWidget: "Enter number", // Label for number widget
 *     labelForColorWidget: "Choose color", // Label for color widget
 *     aboutText: "This is my program!", // Text displayed at "About" settings section
 * }
 *
 * // Define custom locale properties for Russian
 * L.ALS.Locales.addLocaleProperties("Русский", {
 *     labelForNumberWidget: "Введите число",
 *     labelForColorWidget: "Выберите цвет",
 *     aboutText: "Это моя программа!",
 * }
 *
 * L.ALS.System.initializeSystem(); // Initialize system after all locales has been set up
 *
 * let map = ... // Create map
 * // Create system
 * let layerSystem = new L.ALS.System(map, {
 *      aboutHtml: require("./about.js) // Add custom "About" section
 * });
 * // Do your other stuff...
 *
 * // Localise widgets
 *
 * // Imagine code below being at some custom L.ALS.Widgetable where we add our widgets
 *
 * // Pass our new locale properties names as labels to widgets' constructors.
 * // You can pass those names to everything that can be localised.
 * this.addWidgets(
 *     new L.ALS.Widgets.Number("myNumberId", "labelForNumberWidget"),
 *     new L.ALS.Widgets.Color("myColorId", "labelForColorWidget")
 * );
 *
 * // Localize about section
 * // Code below is at "./about.js" script
 *
 * module.exports = `
 * <h1>MyProgram</h1> <!-- Program's name -->
 * <div data-als-locale-property="aboutText"></div> <!-- Program's description localized by "data-als-locale-property" attribute -->
 * `;
 *
 * @namespace
 */
L.ALS.Locales = {

	/**
	 * Localizes HTML element
	 * @param element {Element} Element to localize
	 * @param localeProperty {string} Property name of L.ALS.locale. For example, there's L.ALS.locale.myProperty property which contains your text. You need to pass "myProperty" string here.
	 * @param elementPropertyToLocalize {string} Element's property to output localized text to. If not supplied, will use either textContent, innerText or innerHTML
	 */
	localizeElement: function (element, localeProperty, elementPropertyToLocalize = "") {
		if (!L.ALS.locale[localeProperty])
			return;

		if (elementPropertyToLocalize === "")
			elementPropertyToLocalize = this._getElementPropertyToSet(element);

		element.setAttribute("data-als-locale-property", localeProperty);
		element.setAttribute("data-als-locale-property-to-localize", elementPropertyToLocalize);
		element[elementPropertyToLocalize] = L.ALS.locale[localeProperty];
	},

	/**
	 * Either localizes element by calling localizeElement() or sets localeProperty as element's value if it doesn't exist in L.ALS.locale
	 * @param element {Element} Element to localize
	 * @param localeProperty {string} Property name of L.ALS.locale. For example, there's L.ALS.locale.myProperty property which contains your text. You need to pass "myProperty" string here.
	 * @param elementPropertyToLocalize {string} Element's property to output localized text to. If not supplied, will use either textContent, innerText or innerHTML
	 */
	localizeOrSetValue: function (element, localeProperty, elementPropertyToLocalize = "") {
		if (L.ALS.locale[localeProperty])
			this.localizeElement(element, localeProperty, elementPropertyToLocalize);
		else if (elementPropertyToLocalize === "")
			element[this._getElementPropertyToSet(element)] = localeProperty;
		else
			element[elementPropertyToLocalize] = localeProperty;
	},

	/**
	 * Returns either locale property bound to given element (if set) or property's value
	 * @param element {Element} Element to find property of
	 * @return {string} Found locale property or element's value
	 */
	getLocalePropertyOrValue: function (element) {
		let property = element.getAttribute("data-als-locale-property");
		if (property)
			return property;
		property = element.getAttribute("data-als-locale-property-to-localize");
		if (property)
			return element[property];
		return element[this._getElementPropertyToSet(element)];
	},


	/**
	 * Changes current locale
	 * @param localeName {string} Locale name
	 */
	changeLocale: function (localeName) {
		if (!this[localeName])
			throw new Error(`Locale "${localeName}" does not exist. Did you forget to add it to L.ALS.Locales?`);

		// If locale isn't English, merge it with English
		L.ALS.locale = this[localeName];
		if (localeName !== "English")
			L.ALS.locale = L.ALS.Helpers.mergeOptions(this.English, L.ALS.locale);


		let elements = document.body.querySelectorAll("*[data-als-locale-property]");
		for (let el of elements) {
			let prop = el.getAttribute("data-als-locale-property");
			if (!L.ALS.locale[prop])
				continue;
			let elemProp = el.getAttribute("data-als-locale-property-to-localize");
			elemProp = (elemProp) ? elemProp : this._getElementPropertyToSet(el);
			el[elemProp] = L.ALS.locale[prop];
		}
	},

	/**
	 * Finds element's property to set: either textContent, innerText or innerHTML
	 * @param element {Element} Element to find property of
	 * @return {string} Property
	 * @private
	 */
	_getElementPropertyToSet: function (element) {
		for (let prop of ["textContent", "innerText", "innerHTML"]) {
			if (prop in element)
				return prop;
		}
	},

	/**
	 * Adds new locale properties to given locale.
	 * @param name {string} Name of the locale to add properties to. For example, if you wan't to update English locale
	 * @param locale {Object} Object in format `{key: "value"}`
	 */
	addLocaleProperties: function (name, locale) {
		if (!this[name])
			this[name] = {};
		for (let prop in locale) {
			if (locale.hasOwnProperty(prop) && typeof locale[prop] === "string")
				this[name][prop] = locale[prop];
		}
	}

};
require("./English.js");
L.ALS.locale = L.ALS.Locales["English"];