L.ALS._service.SettingsWindow = L.ALS._service.SidebarWindow.extend({
	initialize: function (button, onCloseCallback) {
		L.ALS._service.SidebarWindow.prototype.initialize.call(this, button, "Settings sections", "Settings for selected section", "Apply and close", onCloseCallback);
	},

	addItem: function (name, item) {
		L.ALS._service.SidebarWindow.prototype.addItem.call(this, name, item);
		for (let i in item._widgets) {
			if (!item._widgets.hasOwnProperty(i))
				continue;

			let widget = item._widgets[i];

			if (!widget.undoable)
				continue;

			if (!widget.attributes.value)
				throw new Error("Your widget doesn't have attributes.value value set! Pass attributes argument containing value property to widget's constructor.");

			let button = document.createElement("i");
			button.className = "button-base fas fa-undo";
			widget.container.appendChild(button);

			button.addEventListener("click", () => {
				widget.setValue(widget.attributes.value);
			});
		}
	},

	statics: {

	},
});