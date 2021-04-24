/**
 * Application settings window
 *
 * @class
 * @extends L.ALS._service.SidebarWindow
 * @ignore
 */
L.ALS._service.SettingsWindow = L.ALS._service.SidebarWindow.extend( /** @lends L.ALS._service.SettingsWindow.prototype */ {

	initialize: function (button, onCloseCallback, aboutHTML = undefined) {
		L.ALS._service.SidebarWindow.prototype.initialize.call(this, button, "settingsSelectTitle", "settingsContentTitle", "settingsApplyButton", () => { this.saveSettings(); });
		this.onCloseCallback = onCloseCallback;

		// Create "About" section
		if (!aboutHTML)
			aboutHTML = require("./aboutMarkup.js");

		this.aboutWidgetable = new L.ALS.Widgetable("als-about-container");
		let wrapper = document.createElement("div");
		wrapper.className = "als-about-wrapper";
		this.aboutWidgetable.container.appendChild(wrapper);

		L.ALS.Helpers.HTMLToElement(aboutHTML, wrapper);

		// Create export and import buttons
		let exportButton = document.createElement("div");
		L.ALS.Locales.localizeElement(exportButton, "settingsExportButton");
		exportButton.setAttribute("data-mobile-class", "ri ri-save-3-line");
		exportButton.addEventListener("click", () => { this.exportSettings(); });

		let importButton = document.createElement("label");
		importButton.htmlFor = "als-load-settings-input";
		L.ALS.Locales.localizeElement(importButton, "settingsImportButton");
		importButton.setAttribute("data-mobile-class", "ri ri-folder-open-line");
		importButton.addEventListener("click", () => { this.importSettings(); });

		for (let button of [exportButton, importButton]) {
			button.className = "als-button-base";
			this.closeButton.parentElement.insertBefore(button, this.closeButton);
		}

		L.ALS.Helpers._applyButtonsIconsIfMobile(this.buttonsWrapper);
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

			let button = document.createElement("i");
			button.className = "ri ri-arrow-go-back-line als-revert-button";
			L.ALS.Locales.localizeElement(button, "settingsRevertButton", "title");
			widget.containerForRevertButton.appendChild(button);

			button.addEventListener("click", () => {
				widget.setValue(widget._defaultSettingsValue);
				widget.callCallback();
			});

			if (button.click)
				button.click();
			else
				L.ALS.Helpers.dispatchEvent(button, "click");
		}
		this.removeItem("settingsAboutItem");
		this.addItem("settingsAboutItem", this.aboutWidgetable);
		this.restoreSettingsFromStorage();
	},

	/**
	 * Saves settings
	 */
	saveSettings: function () {
		this.forEachWidget((item, widget, key, value) => {
			L.ALS.Helpers.localStorage.setItem(key, value);
		});
		this.onCloseCallback();
	},

	/**
	 * Saves settings as a text file. Being called when user presses the button.
	 */
	exportSettings: function () {
		let json = {};
		this.forEachWidget((item, widget, key, value) => {
			json[key] = value;
		});
		L.ALS.Helpers.saveAsText(JSON.stringify(json), "SynthFlightSettings.json");
	},

	/**
	 * Imports settings from a text file. Being called when user presses the button.
	 */
	importSettings: function () {
		let loadButton = document.getElementById("als-load-settings-input");
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
			this.updateWindowHeight();
		});
	},

	/**
	 * Loops through each widget and calls given callback
	 * @param callback {function(string, string, string, *)} Callback to call
	 */
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

	/**
	 * Restores settings from local storage when app's being loaded
	 */
	restoreSettingsFromStorage: function () {
		this.forEachWidget((item, widget, key) => {
			let newValue = L.ALS.Helpers.localStorage.getItem(key);
			if (newValue)
				this.setWidgetValue(item, widget, newValue)
		});
		this.updateWindowHeight();
	},

	/**
	 * Sets widget's value
	 * @param item {string} Name of the item (widgetable)
	 * @param widget {string} Name of the widget in the item
	 * @param value {*} Value to set
	 */
	setWidgetValue: function (item, widget, value) {
		let w = this.getItem(item).getWidgetById(widget);
		w.setValue(value);
		w.callCallback();
	}

});