L.ALS.Widgets = {};

require("./BaseWidget.js");
require("./Time.js");
require("./DropDownList.js");
require("./SimpleLabel.js");
require("./ValueLabel.js");
require("./TextArea.js");
require("./Number.js");
require("./Checkbox.js");

// Build textual widgets
let types = ["Text", "Email", "Password", "Color"];
for (let type of types) {
	L.ALS.Widgets[type] = L.ALS.Widgets.BaseWidget.extend({
		initialize: function (id, label, objectToControl = undefined, callback = "", attributes = {}) {
			L.ALS.Widgets.BaseWidget.prototype.initialize.call(this, type, id, label, objectToControl, callback, ["edit", "change"], attributes);
		}
	});
}