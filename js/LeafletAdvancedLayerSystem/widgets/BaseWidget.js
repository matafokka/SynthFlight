/**
 * Base class for all widgets. This class should NOT be instantiated!
 * @type {Input}
 */
L.ALS.Widgets.BaseWidget = L.ALS.Serializable.extend({

	/**
	 * Custom classname for an input wrapper. Should NOT be changed from outside.
	 */
	customWrapperClassName: "",

	/**
	 * Indicates whether this widget can revert back to it's default value. If this widget is undoable, an undo button will be appended to it at settings window.
	 */
	undoable: true,

	/**
	 * Constructs this widget.
	 * @param type {string} Type of input
	 * @param id {string} ID of this input. You can select this object using this ID.
	 * @param label {string} Label for this input
	 * @param objectToControl {Object|L.ALS.Serializable} Just pass "this". If you plan to use serialization, this object MUST be instance of L.ALS.Serializable.
	 * @param callback {string} Name of a method of objectToControl that will be called when widget's value changes
	 * @param events {string[]} Array containing event's names to bind to the provided callback
	 * @param attributes {Object} Attributes of an input, such as min, max, etc in format `{attributeName1: attributeValue1, attributeName2: attributeValue2, ...}`
	 */
	initialize: function (type, id, label, objectToControl = undefined, callback = "", events = [], attributes = {}) {
		L.ALS.Serializable.prototype.initialize.call(this);
		this.setConstructorArguments(arguments);
		this.serializationIgnoreList.push("getContainer");

		this.objectToControl = objectToControl;
		this.events = events;
		this._inputID = "adv-lyr_sys_input" + L.ALS.Helpers.generateID();

		this.type = type;
		this.id = id;
		this.labelText = label;
		this.callback = callback;
		this.attributes = attributes;
		this.container = this.toHtmlElement();
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
		container.className = "adv-lyr-sys-widget-row";
		return container;
	},

	/**
	 * Creates label for this widget
	 * @return {HTMLLabelElement} Label
	 */
	createLabel: function () {
		this.labelWidget = document.createElement("label");
		this.labelWidget.className = "adv-lyr-sys-label";
		this.labelWidget.htmlFor = this._inputID;
		this.setLabelText(this.labelText);
		return this.labelWidget;
	},

	/**
	 * Creates input element. You can also create non-input elements here.
	 * @return {HTMLElement}
	 */
	createInputElement: function () {
		let input = document.createElement("input");
		input.setAttribute("type", this.type);
		return input;
	},

	/**
	 * Creates input element. If you're creating different element, override createInputElement() instead of this.
	 * @return {HTMLElement} Input element
	 * @protected
	 */
	_createInput: function () {
		// Create input
		this.input = this.createInputElement();
		this.input.id = this._inputID;
		this.input.setAttribute("data-id", this.id);

		// Bind events
		for (let event of this.events)
			this.input.addEventListener(event, (event) => {
				if (!this.onChange(event))
					this.input.classList.add("invalid-input");
				else
					this.input.classList.remove("invalid-input");
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
		wrapper.className = "adv-lyr-sys-input " + this.customWrapperClassName;
		wrapper.appendChild(this.input);
		return wrapper;
	},

	/**
	 * Sets attributes of an input, such as min, max, etc in format `{attributeName1: attributeValue1, attributeName2: attributeValue2, ...}`
	 * @param attributes Object containing attributes
	 */
	setAttributes: function (attributes) {
		if (this.input === undefined)
			return; // In some cases widgets doesn't have an input
		for (let attr in attributes) {
			if (attributes.hasOwnProperty(attr))
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
	 * @param event Event fired by input
	 * @return {boolean} If true, the attached callback will be called. If false, attached callback won't be called.
	 */
	onChange: function (event) {
		return true;
	},

	/**
	 * Calls callback attached to this widget
	 */
	callCallback: function () {
		if (this.objectToControl !== undefined && this.callback !== "")
			this.objectToControl[this.callback](this);
	},

	getId: function () {
		return this.id;
	},

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

	getEnabled: function () {
		if (!this.input)
			return true;
		return (this.input.disabled !== "true");
	},

	setEnabled: function (isEnabled) {
		if (this.input)
			this.input.disabled = !isEnabled;
	},

	getContainer: function () {
		return this.container;
	},

	getLabelText: function () {
		if (!this.labelWidget) // When widget doesn't have label, labelWidget will be undefined. In this case, return empty string.
			return "";
		return this.labelWidget.innerHTML.slice(0, this.labelWidget.innerHTML.length - 1);
	},

	setLabelText: function (text) {
		if (this.labelWidget) // See comment above
			this.labelWidget.innerHTML = text + ":";
	},

});