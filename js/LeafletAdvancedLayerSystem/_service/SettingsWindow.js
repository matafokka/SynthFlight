L.ALS._service.SettingsWindow = L.ALS._service.SidebarWindow.extend({
	initialize: function (button, onCloseCallback, aboutHTML = undefined) {
		L.ALS._service.SidebarWindow.prototype.initialize.call(this, button, "Settings sections", "Settings for selected section", "Apply and close", () => { this.saveSettings(); });
		this.onCloseCallback = onCloseCallback;

		// Create "About" section
		if (!aboutHTML)
			aboutHTML = require("./aboutMarkup.js");

		this.aboutWidgetable = new L.ALS.Widgetable("adv-lyr-sys-about-container");
		let wrapper = document.createElement("div");
		wrapper.className = "adv-lyr-sys-about-wrapper";
		this.aboutWidgetable.container.appendChild(wrapper);

		L.ALS.Helpers.HTMLToElement(aboutHTML, wrapper);
		let footer = this.aboutWidgetable.container.querySelector("footer");
		if (footer)
			this.aboutWidgetable.container.appendChild(footer);

		// Create export and import buttons
		let exportButton = document.createElement("div");
		exportButton.innerText = "Export Settings";
		exportButton.addEventListener("click", () => { this.exportSettings(); })

		let importButton = document.createElement("label");
		importButton.htmlFor = "adv-lyr-sys-load-settings-input";
		importButton.innerText = "Import Settings";
		importButton.addEventListener("click", () => { this.importSettings(); })

		for (let button of [exportButton, importButton]) {
			button.className = "button-base";
			this.closeButton.parentElement.insertBefore(button, this.closeButton);
		}
	},

	addItem: function (name, item) {
		L.ALS._service.SidebarWindow.prototype.addItem.call(this, name, item);
		if (name === "About")
			return;

		for (let i in item._widgets) {
			if (!item._widgets.hasOwnProperty(i))
				continue;

			let widget = item._widgets[i];
			if (!widget.undoable)
				continue;

			if (!widget.attributes.defaultValue)
				throw new Error("Your widget doesn't have attributes.defaultValue set! Pass attributes argument containing value property to widget's constructor.");

			let button = document.createElement("i");
			button.className = "fas fa-undo revert-button";
			button.title = "Revert back to default value";
			widget.container.appendChild(button);

			button.addEventListener("click", () => {
				widget.setValue(widget.attributes.defaultValue);
			});

			if (button.click)
				button.click()
			else
				L.ALS.Helpers.dispatchEvent(button, "click");
		}
		this.removeItem("About");
		this.addItem("About", this.aboutWidgetable);
		this.restoreSettingsFromStorage();
	},

	saveSettings: function () {
		this.forEachWidget((item, widget, key, value) => {
			window.localStorage.setItem(key, value);
		});
		this.onCloseCallback();
	},

	exportSettings: function () {
		let json = {};
		this.forEachWidget((item, widget, key, value) => {
			json[key] = value;
		});
		L.ALS.Helpers.saveAsText(JSON.stringify(json), "SynthFlightSettings.json");
	},

	importSettings: function () {
		let loadButton = document.getElementById("adv-lyr-sys-load-settings-input");
		loadButton.addEventListener("change", () => {
			L.ALS.Helpers.readTextFile(loadButton, "Sorry, your browser doesn't supprot file loading. Please, update it.", (text) => {

				let json;
				try { json = JSON.parse(text); }
				catch (e) {
					window.alert("File that you try to load is not SynthFlight settings file");
					return;
				}

				this.forEachWidget((item, widget, key) => {
					if (json[key])
						this.getItem(item).getWidgetById(widget).setValue(json[key]);
				});
			});
		});
	},

	forEachWidget: function (callback) {
		for (let name in this.items) {
			if (name === "About")
				continue;

			let item = this.items[name].widgetable;
			let sectionPart = name + "|";
			for (let w in item._widgets) {
				if (item._widgets.hasOwnProperty(w))
					callback(name, w, sectionPart + w, item._widgets[w].getValue());
			}
		}
	},

	restoreSettingsFromStorage: function () {
		this.forEachWidget((item, widget, key) => {
			let newValue = window.localStorage.getItem(key);
			if (newValue)
				this.getItem(item).getWidgetById(widget).setValue(newValue);
		});
	}

});