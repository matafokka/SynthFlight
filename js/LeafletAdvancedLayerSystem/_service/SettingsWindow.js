L.ALS._service.SettingsWindow = L.ALS._service.SidebarWindow.extend({
	initialize: function (button, onCloseCallback, aboutHTML = undefined) {
		L.ALS._service.SidebarWindow.prototype.initialize.call(this, button, "settingsSelectTitle", "settingsContentTitle", "settingsApplyButton", () => { this.saveSettings(); });
		this.onCloseCallback = onCloseCallback;

		// Create "About" section
		if (!aboutHTML)
			aboutHTML = require("./aboutMarkup.js");

		this.aboutWidgetable = new L.ALS.Widgetable("adv-lyr-sys-about-container");
		let wrapper = document.createElement("div");
		wrapper.className = "adv-lyr-sys-about-wrapper";
		this.aboutWidgetable.container.appendChild(wrapper);

		L.ALS.Helpers.HTMLToElement(aboutHTML, wrapper);

		// Create export and import buttons
		let exportButton = document.createElement("div");
		L.ALS.Locales.localizeElement(exportButton, "settingsExportButton");
		exportButton.addEventListener("click", () => { this.exportSettings(); })

		let importButton = document.createElement("label");
		importButton.htmlFor = "adv-lyr-sys-load-settings-input";
		L.ALS.Locales.localizeElement(importButton, "settingsImportButton");
		importButton.addEventListener("click", () => { this.importSettings(); })

		for (let button of [exportButton, importButton]) {
			button.className = "button-base";
			this.closeButton.parentElement.insertBefore(button, this.closeButton);
		}
	},

	addItem: function (name, item) {
		L.ALS._service.SidebarWindow.prototype.addItem.call(this, name, item);
		if (name === "settingsAboutItem")
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
			L.ALS.Locales.localizeElement(button, "settingsRevertButton", "title");
			widget.container.appendChild(button);

			button.addEventListener("click", () => {
				widget.setValue(widget.attributes.defaultValue);
				widget.callCallback();
			});

			if (button.click)
				button.click()
			else
				L.ALS.Helpers.dispatchEvent(button, "click");
		}
		this.removeItem("settingsAboutItem");
		this.addItem("settingsAboutItem", this.aboutWidgetable);
		this.restoreSettingsFromStorage();
	},

	saveSettings: function () {
		this.forEachWidget((item, widget, key, value) => {
			L.ALS.Helpers.localStorage.setItem(key, value);
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
			L.ALS.Helpers.readTextFile(loadButton, L.ALS.locale.settingsLoadingNotSupported, (text) => {

				let json;
				try { json = JSON.parse(text); }
				catch (e) {
					window.alert(L.ALS.locale.settingsImportError);
					return;
				}

				this.forEachWidget((item, widget, key) => {
					if (json[key])
						this.setWidgetValue(item, widget, json[key])
				});
			});
		});
	},

	forEachWidget: function (callback) {
		for (let name in this.items) {
			if (name === "settingsAboutItem")
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
			let newValue = L.ALS.Helpers.localStorage.getItem(key);
			if (newValue)
				this.setWidgetValue(item, widget, newValue)
		});
	},

	setWidgetValue: function (item, widget, value) {
		let w = this.getItem(item).getWidgetById(widget);
		w.setValue(value);
		w.callCallback();
	}

});