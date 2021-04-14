L.ALS._service.GeneralSettings = L.ALS.Settings.extend({
	_lightTheme: "generalSettingsLightTheme",
	_darkTheme: "generalSettingsDarkTheme",
	_systemTheme: "generalSettingsSystemTheme",

	initialize: function () {
		L.ALS.Settings.prototype.initialize.call(this);

		// Find dark theme stylesheet
		for (let sheet of document.styleSheets) {
			if (!sheet.href.endsWith("/dark.css"))
				continue;
			this._darkThemeSheet = sheet;
			break;
		}

		// Build language widget
		let languageWidget = new L.ALS.Widgets.DropDownList("lang", "generalSettingsLanguage", this, "changeLocale");
		for (let locale in L.ALS.Locales) {
			if (L.ALS.Locales.hasOwnProperty(locale) && typeof L.ALS.Locales[locale] !== "function")
				languageWidget.addItem(locale);
		}
		languageWidget.setAttributes({ defaultValue: "English" });

		// Build theme widget
		let themeWidget = new L.ALS.Widgets.DropDownList("theme", "generalSettingsTheme", this, "changeTheme");
		for (let theme of [this._lightTheme, this._darkTheme])
			themeWidget.addItem(theme);

		// Check if prefers-color-scheme supported and add system theme to the themes list
		let defaultValue = this._lightTheme;
		let mediaQuery = "(prefers-color-scheme: dark)";
		if (window.matchMedia && window.matchMedia(mediaQuery).media === mediaQuery) {
			themeWidget.addItem(this._systemTheme);
			this.systemThemeMedia = window.matchMedia(mediaQuery);
			this.systemThemeMedia.addEventListener("change", () => {
				if (themeWidget.getValue() === this._systemTheme)
					this.changeThemeWorker(this._systemTheme);
			});
			defaultValue = this._systemTheme;
		}
		themeWidget.setAttributes({ defaultValue: defaultValue });

		// Add those widgets to this widgetable
		let widgets = [languageWidget, themeWidget];
		for (let widget of widgets)
			this.addWidget(widget);
	},

	changeLocale: function (widget) {
		L.ALS.Locales.changeLocale(widget.getValue());
	},

	changeTheme: function (widget) {
		this.changeThemeWorker(widget.getValue());
	},

	changeThemeWorker: function (value) {
		if (value === this._systemTheme)
			this.changeThemeWorker(this.systemThemeMedia.matches ? this._darkTheme : this._lightTheme)
		else
			this._darkThemeSheet.disabled = (value !== this._darkTheme);
	},
})