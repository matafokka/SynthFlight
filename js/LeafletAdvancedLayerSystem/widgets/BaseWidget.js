/**
 * Base class for all widgets.
 *
 * @param type {string} Type of input
 * @param id {string} ID of this input. You can select this object using this ID.
 * @param label {string} Label for this input. You can also pass locale property to localize the label.
 * @param callbackObject {Object|L.ALS.Serializable} Object which contains callback. Just pass "this". If you plan to use serialization, this object MUST be instance of L.ALS.Serializable.
 * @param callback {string} Name of the method of callbackObject that will be called when widget's value changes
 * @param events {string[]} Array of event's names to bind to the provided callback
 * @param attributes {Object} Attributes of an input, such as min, max, etc in format `{attributeName1: attributeValue1, attributeName2: attributeValue2, ...}`
 *
 * @class
 * @extends L.ALS.Serializable
 */
L.ALS.Widgets.BaseWidget = L.ALS.Serializable.extend( /** @lends L.ALS.Widgets.BaseWidget.prototype */ {

	/**
	 * Custom classname for an input wrapper. Should NOT be modified from outside.
	 * @readonly
	 */
	customWrapperClassName: "",

	/**
	 * Indicates whether this widget can revert back to it's default value. If this widget is undoable, an undo button will be appended to it at settings window.
	 * @readonly
	 */
	undoable: true,

	/** @constructs */
	initialize: function (type, id, label, callbackObject = undefined, callback = "", events = [], attributes = {}) {
		L.ALS.Serializable.prototype.initialize.call(this);
		this.setConstructorArguments(arguments);
		this.serializationIgnoreList.push("getContainer");

		/**
		 * Object which contains callback
		 * @type {Object} @private
		 */
		this._callbackObject = callbackObject;

		/**
		 * Events to bind
		 * @type {string[]}
		 * @private
		 */
		this._events = events;

		/**
		 * Inner ID of an input element
		 * @type {string}
		 * @private
		 */
		this._inputID = "adv-lyr_sys_input" + L.ALS.Helpers.generateID();

		/**
		 * Input type
		 * @type {string}
		 * @private
		 */
		this._type = type;

		/**
		 * This widget's ID
		 */
		this.id = id;

		/**
		 * This widget's initial label text
		 * @private
		 */
		this._labelText = label;

		/**
		 * Callback function name
		 * @type {string}
		 * @private
		 */
		this._callback = callback;

		/**
		 * Attributes of this widget's input
		 * @type {{}}
		 */
		this.attributes = attributes;

		/**
		 * Container of this widget
		 * @type {HTMLDivElement}
		 */
		this.container = this.toHtmlElement();

		/**
		 * Container to place revert button to. Used by the settings
		 * @type Element
		 */
		this.containerForRevertButton = this.container;
	},

	/**
	 * Builds this widget, i.e. creates container and puts label and input here.
	 *
	 * Default implementation is:
	 * ```JavaScript
	 * let container = this.createContainer();
	 * container.appendChild(this.createLabel());
	 * container.appendChild(this._createInput());
	 * return container;
	 * ```
	 *
	 * @return {HTMLDivElement} HTML representation of this widget
	 */
	toHtmlElement: function () {
		let container = this.createContainer();
		container.appendChild(this.createLabel());
		container.appendChild(this._createInput());
		return container;
	},

	/**
	 * Creates container for this widget
	 * @return {HTMLDivElement} Container for this widget
	 */
	createContainer: function () {
		let container = document.createElement("div");
		container.className = "als-widget-row";
		return container;
	},

	/**
	 * Creates label for this widget
	 * @return {HTMLLabelElement} Label
	 */
	createLabel: function () {
		this.labelWidget = document.createElement("label");
		this.labelWidget.className = "als-label";
		this.labelWidget.htmlFor = this._inputID;
		this.setLabelText(this._labelText);
		return this.labelWidget;
	},

	/**
	 * Creates input element. You can also create non-input elements here.
	 * @return {HTMLElement}
	 */
	createInputElement: function () {
		let input = document.createElement("input");
		input.setAttribute("type", this._type);
		return input;
	},

	/**
	 * Creates input element. If you're creating different element, override createInputElement() instead of this.
	 * @return {HTMLElement} Input element
	 * @protected
	 */
	_createInput: function () {
		/**
		 * Input element controlled by this widget
		 * @type {HTMLElement}
		 * @protected
		 */
		this.input = this.createInputElement();
		this.input.id = this._inputID;
		this.input.setAttribute("data-id", this.id);

		// Bind events
		for (let event of this._events)
			this.input.addEventListener(event, (event) => {
				if (!this.onChange(event))
					this.input.classList.add("als-invalid-input");
				else
					this.input.classList.remove("als-invalid-input");
				this.callCallback();
			});

		this.setAttributes(this.attributes);

		// Set value so input won't be empty
		let value;
		if (this.attributes.value !== undefined)
			value = this.attributes.value;

		this.setValue(value);

		// Wrap input
		let wrapper = document.createElement("div");
		wrapper.className = "als-input " + this.customWrapperClassName;
		wrapper.appendChild(this.input);
		return wrapper;
	},

	/**
	 * Sets attributes of an input, such as min, max, etc in format `{attributeName1: attributeValue1, attributeName2: attributeValue2, ...}`
	 * @param attributes Object containing attributes
	 */
	setAttributes: function (attributes) {
		for (let attr in attributes) {
			if (this.input && attributes.hasOwnProperty(attr))
				this.input.setAttribute(attr, attributes[attr]);
			if (attr === "defaultValue") // Exception for default values
				this.attributes.defaultValue = attributes[attr];
		}
	},

	/**
	 * Being called when user changes this widget. Override it to add your functionality like validation.
	 *
	 * Default implementation just returns true.
	 *
	 * @param event {Event} Event fired by input
	 * @return {boolean} If true, the attached callback will be called. If false, attached callback won't be called.
	 */
	onChange: function (event) {
		return true;
	},

	/**
	 * Calls callback attached to this widget
	 */
	callCallback: function () {
		if (this._callbackObject !== undefined && this._callback !== "")
			this._callbackObject[this._callback](this);
	},

	/**
	 * @return {string} ID of this widget
	 */
	getId: function () {
		return this.id;
	},

	/**
	 * @return {*} Value of this widget
	 */
	getValue: function () {
		if (!this.input) // In some cases widget (like label) won't have input. In this case return undefined.
			return undefined;
		return this.input.value;
	},

	/**
	 * Sets value of this widget.
	 *
	 * *Note: This method is being called before container has been assigned to the widget.
	 * Before accessing container in this method, check if it's undefined: `if (this.container === undefined) return;`*
	 *
	 * @param value - Value to set
	 */
	setValue: function (value) {
		if (this.input) // See comment above
			this.input.value = value;
	},

	/**
	 * @return {boolean} True, if this widget is enabled. False otherwise.
	 */
	getEnabled: function () {
		if (!this.input)
			return true;
		return (this.input.disabled !== "true");
	},

	/**
	 * Sets whether this widget should be enabled or not
	 * @param isEnabled {boolean}
	 */
	setEnabled: function (isEnabled) {
		if (this.input)
			this.input.disabled = !isEnabled;
	},

	/**
	 * @return {Element} Container of this widget
	 */
	getContainer: function () {
		return this.container;
	},

	/**
	 * @return {string} Text of the label of this widget
	 */
	getLabelText: function () {
		if (!this.labelWidget) // When widget doesn't have label, labelWidget will be undefined. In this case, return empty string.
			return "";
		return this.labelWidget.textContent.slice(0, this.labelWidget.innerHTML.length - 1);
	},

	/**
	 * Sets label text
	 * @param text {string} Text to set. You can also pass locale property to localize the label.
	 */
	setLabelText: function (text) {
		if (this.labelWidget) // See comment above
			L.ALS.Locales.localizeOrSetValue(this.labelWidget, text);
	},

});