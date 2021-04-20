/**
 * Contains widgets to add to `Widgetable`s
 */
L.ALS.Widgets = {
	/**
	 * A simple text input widget
	 */
	Text: undefined,

	/**
	 * Default email input
	 */
	Email: undefined,

	/**
	 * Password input widget
	 */
	Password: undefined,
};

require("./BaseWidget.js");
require("./Time.js");
require("./Button.js");
require("./ItemsWidgetInterface.js");
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
		initialize: function (id, label, objectToControl = undefined, callback = "", attributes = {}) {
			L.ALS.Widgets.BaseWidget.prototype.initialize.call(this, type, id, label, objectToControl, callback, ["edit", "change"], attributes);
			this.setConstructorArguments(arguments);
		}
	});
}