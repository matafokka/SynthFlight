/**
 * Contains widgets to add to `Widgetable`s
 */
L.ALS.Widgets = {};

require("./BaseWidget.js");
require("./Time.js");
require("./DropDownList.js");
require("./SimpleLabel.js");
require("./ValueLabel.js");
require("./TextArea.js");
require("./Number.js");
require("./Checkbox.js");
require("./RadioButtonGroup.js");
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