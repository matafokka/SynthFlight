/**
 * Base class for all widgets.
 *
 * This class should be used only to create custom widgets. It shouldn't be used in application itself.
 *
 * See {@link L.ALS.Widgets} docs for the example on working with Widgetables and Widgets.
 *
 * Guidelines on creating custom widgets:
 *
 * 1. You'll probably need to have a prior knowledge of how widgets works. Please, study the widgets' markup and existing widgets' source code. Yup, that sucks but there's no good workaround.
 * 1. As an alternative, you can build your widget from scratch, though, it's not recommended. If you choose to do so, please, use ALS classes in your elements to maintain consistency.
 * 1. Widget's layout is being created at {@link L.ALS.Widgets.BaseWidget#toHtmlElement} method. Compose your widget here.
 * 1. There're couple of useful methods for composing widgets, such as {@link L.ALS.Widgets.BaseWidget#createLabel}, {@link L.ALS.Widgets.BaseWidget#createInputElement}, etc. Use it to simplify your workflow.
 * 1. If you want to modify those helper methods, you can either override them or change something at {@link L.ALS.Widgets.BaseWidget#toHtmlElement}. Do whatever works better for you.
 * 1. You can safely remove either input or label from your widget by simply not creating it.
 * 1. Setters and other public methods should `return this`, so API users can chain it.
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
	 * Value to set when user presses revert button. Used only in settings.
	 * @package
	 * @ignore
	 */
	_defaultSettingsValue: undefined,

	/**
	 * Custom classname for an input wrapper. Should NOT be modified from outside.
	 * @protected
	 * @readonly
	 */
	customWrapperClassName: "",

	/**
	 * Indicates whether this widget can revert back to it's default value. If this widget is undoable, an undo button will be appended to it at settings window.
	 * @readonly
	 */
	undoable: true,

	/**
	 * Indicates whether this widget has been added to the widgetable. Needed to detect whether a callback should be called.
	 * @package
	 * @ignore
	 */
	_isAdded: false,

	initialize: function (type, id, label, callbackObject = undefined, callback = "", events = []) {
		L.ALS.Serializable.prototype.initialize.call(this);
		this.setConstructorArguments(arguments);
		this.serializationIgnoreList.push("_getContainer");

		/**
		 * Object which contains callback
		 * @type {Object}
		 * @private
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
		 * @readonly
		 */
		this.id = id;

		/**
		 * This widget's initial label text
		 * @type {string}
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
		 * Container of this widget
		 * @type {HTMLDivElement}
		 * @protected
		 */
		this.container = this.toHtmlElement();

		/**
		 * Container to place revert button to. Used by the settings.
		 * @type Element
		 * @protected
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
	 * container.appendChild(this.createInput());
	 * return container;
	 * ```
	 *
	 * @return {HTMLDivElement} HTML representation of this widget
	 * @protected
	 */
	toHtmlElement: function () {
		let container = this.createContainer();
		container.appendChild(this.createLabel());
		container.appendChild(this.createInput());
		return container;
	},

	/**
	 * Creates container for this widget
	 * @return {HTMLDivElement} Container for this widget
	 * @protected
	 */
	createContainer: function () {
		let container = document.createElement("div");
		container.className = "als-widget-row";
		return container;
	},

	/**
	 * Creates label for this widget
	 * @return {HTMLLabelElement} Label
	 * @protected
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
	 *
	 * Use it only to create input element. To add input element at {@link L.ALS.Widgets.BaseWidget#toHtmlElement}, use {@link L.ALS.Widgets.BaseWidget#createInput}
	 *
	 * @return {HTMLElement} Input element
	 * @protected
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
	createInput: function () {
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

		// Wrap input
		let wrapper = document.createElement("div");
		wrapper.className = "als-input " + this.customWrapperClassName;
		wrapper.appendChild(this.input);
		return wrapper;
	},

	/**
	 * Being called when user changes this widget. Override it to add your functionality like validation.
	 *
	 * Default implementation just returns true.
	 *
	 * @param event {Event} Event fired by input
	 * @return {boolean} If true, the attached callback will be called. If false, attached callback won't be called.
	 * @protected
	 */
	onChange: function (event) {
		return true;
	},

	/**
	 * Calls callback attached to this widget
	 *
	 * **Warning:** Callback will be called only when widget will be added to the widgetable! Util that all calls will be paused.
	 * @return {VoidFunction}
	 */
	callCallback: async function () {
		while (!this._isAdded)
			await new Promise(resolve => setTimeout(resolve, 0)); // Infinite loop hangs the script. Timeout prevents it.
		if (this._callbackObject !== undefined && this._callback !== "")
			this._callbackObject[this._callback](this);
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
	 * @param value {*} Value to set
	 * @return {L.ALS.Widgets.BaseWidget} This
	 */
	setValue: function (value) {
		if (this.input) // See comment above
			this.input.value = value;
		return this;
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
	 * @return {L.ALS.Widgets.BaseWidget} This
	 */
	setEnabled: function (isEnabled) {
		if (this.input)
			this.input.disabled = !isEnabled;
		return this;
	},

	/**
	 * @return {Element} Container of this widget
	 * @package
	 */
	_getContainer: function () {
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
	 * @return {L.ALS.Widgets.BaseWidget} This
	 */
	setLabelText: function (text) {
		if (this.labelWidget) // See comment above
			L.ALS.Locales.localizeOrSetValue(this.labelWidget, text);
		return this;
	},

	/**
	 * @return {Element} Container for revert button
	 * @package
	 */
	_getContainerForRevertButton: function () {
		return this.containerForRevertButton;
	}

});