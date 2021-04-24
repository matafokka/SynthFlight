/**
 * Contains widgets to add to {@link L.ALS.Widgetable}s.
 *
 * @example Code style to add multiple widgets at one time.
 *
 * // This code goes inside of some widgetable.
 *
 * // Add widgets to the widgetable
 * this.addWidgets(
 *      // We can instantiate a widget and set it's properties at the same time by chaining all of that. Each setter returns the same widget.
 *      (new L.ALS.Widgets.Number("myNumber0", "Number 0", this, "someCallback0")).setMin(0).setMax(100).setStep(2).setValue(50),
 *
 *      // addWidgets() accepts numerous widgets. So let's add some more.
 *      (new L.ALS.Widgets.Number("myNumber1", "Number 1", this, "someCallback1")).setMin(0).setMax(1).setStep(0.1).setValue(0),
 *      (new L.ALS.Widgets.Color("myColor", "Color", this, "someCallback2")).setValue("red"),
 * );
 *
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