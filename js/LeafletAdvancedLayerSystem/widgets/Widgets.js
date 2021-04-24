/**
 * Contains widgets to add to {@link L.ALS.Widgetable}s.
 *
 * Important notes:
 * 1. Widgets can be added only to {@link L.ALS.Widgetable} using {@link L.ALS.Widgetable#addWidget}.
 * 1. Widgets are using rather strange callback system due to limits related to the serialization.
 * 1. All widgets' public methods returns this, i.e. they can be chained.
 *
 * Please, take a look at example below which explains all these thing.
 *
 * @example Create and add some widgets to the Layer's menu
 *
 * L.ALS.MyLayer = L.ALS.Layer.extend({
 *
 *      init: function (wizardResults, settings) {
 *          // Add widgets to the layer
 *          this.addWidgets(
 *              // Take a look at last two arguments. Third argument is an object which contains our callback. Fourth argument is a callback name.
 *              // As a result, when widget's value will change, L.ALS.MyLayer#someCallback0 method will be called.
 *              (new L.ALS.Widgets.Number("myNumber0", "Number 0", this, "someCallback0")).
 *              setMin(0).setMax(100).setStep(2).setValue(50), // We can instantiate a widget and set it's properties at the same time by chaining all of that. Each setter returns the same widget.
 *
 *              // L.ALS.Widgetable#addWidgets() accepts numerous widgets. So let's add some more.
 *              (new L.ALS.Widgets.Number("myNumber1", "Number 1", this, "someCallback1")).setMin(0).setMax(1).setStep(0.1).setValue(0),
 *              (new L.ALS.Widgets.Color("myColor", "Color", this, "someCallback2")).setValue("red"),
 *          );
 *      },
 *
 *      // Add callbacks which will just console.log() widgets' values
 *      someCallback0: function (widget) { console.log(widget.getValue()); }, // For "myNumber0" widget
 *      someCallback1: function (widget) { console.log(widget.getValue()); }, // For "myNumber1" widget
 *      someCallback2: function (widget) { console.log(widget.getValue()); }, // For "myColor" widget
 *}
 * @namespace
 */
L.ALS.Widgets = {
	/**
	 * A simple text input widget
	 *
	 * @param id {string} ID of this input. You can select this object using this ID.
	 * @param label {string} Label for this input. You can also pass locale property to localize the label.
	 * @param callbackObject {Object|L.ALS.Serializable} Object which contains callback. Just pass "this". If you plan to use serialization, this object MUST be instance of L.ALS.Serializable.
	 * @param callback {string} Name of the method of callbackObject that will be called when widget's value changes.
	 *
	 * @class
	 * @extends L.ALS.Widgets.BaseWidget
	 */
	Text: undefined,

	/**
	 * Default email input
	 *
	 * @param id {string} ID of this input. You can select this object using this ID.
	 * @param label {string} Label for this input. You can also pass locale property to localize the label.
	 * @param callbackObject {Object|L.ALS.Serializable} Object which contains callback. Just pass "this". If you plan to use serialization, this object MUST be instance of L.ALS.Serializable.
	 * @param callback {string} Name of the method of callbackObject that will be called when widget's value changes.
	 *
	 * @class
	 * @extends L.ALS.Widgets.BaseWidget
	 */
	Email: undefined,

	/**
	 * Password input widget
	 *
	 * @param id {string} ID of this input. You can select this object using this ID.
	 * @param label {string} Label for this input. You can also pass locale property to localize the label.
	 * @param callbackObject {Object|L.ALS.Serializable} Object which contains callback. Just pass "this". If you plan to use serialization, this object MUST be instance of L.ALS.Serializable.
	 * @param callback {string} Name of the method of callbackObject that will be called when widget's value changes.
	 *
	 * @class
	 * @extends L.ALS.Widgets.BaseWidget
	 */
	Password: undefined,
};

require("./BaseWidget.js");
require("./Time.js");
require("./Button.js");
require("./BaseItemsWidget.js");
require("./DropDownList.js");
require("./RadioButtonsGroup.js");
require("./ButtonsGroup.js");
require("./SimpleLabel.js");
require("./ValueLabel.js");
require("./TextArea.js");
require("./Number.js");
require("./Checkbox.js");
require("./Divider.js");
require("./File.js");
require("./Color.js");

// Build textual widgets
let types = ["Text", "Email", "Password"];
for (let type of types) {
	L.ALS.Widgets[type] = L.ALS.Widgets.BaseWidget.extend({
		initialize: function (id, label, callbackObject = undefined, callback = "") {
			L.ALS.Widgets.BaseWidget.prototype.initialize.call(this, type, id, label, callbackObject, callback, ["edit", "change"]);
			this.setConstructorArguments(arguments);
		}
	});
}