L.ALS._service.GeneralSettings = L.ALS.Settings.extend({
	_lightTheme: "generalSettingsLightTheme",
	_darkTheme: "generalSettingsDarkTheme",
	_systemTheme: "generalSettingsSystemTheme",

	initialize: function () {
		L.ALS.Settings.prototype.initialize.call(this);

		let languageWidget = new L.ALS.Widgets.DropDownList("lang", "generalSettingsLanguage", this, "changeLocale");
		for (let locale in L.ALS.Locales) {
			if (L.ALS.Locales.hasOwnProperty(locale) && typeof L.ALS.Locales[locale] !== "function")
				languageWidget.addItem(locale);
		}
		languageWidget.setAttributes({ defaultValue: "English" });

		let themeWidget = new L.ALS.Widgets.DropDownList("theme", "generalSettingsTheme", this, "changeTheme");
		for (let theme of [this._lightTheme, this._darkTheme])
			themeWidget.addItem(theme);

		let defaultValue = this._lightTheme;
		if (window.matchMedia) {
			themeWidget.addItem(this._systemTheme);
			this.systemThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");
			this.systemThemeMedia.addEventListener("change", e => {
				if (themeWidget.getValue() === this._systemTheme)
					this.changeThemeWorker(this._systemTheme);
			});
			defaultValue = this._systemTheme;
		}
		themeWidget.setAttributes({ defaultValue: defaultValue });

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
		else if (value === this._darkTheme)
			document.body.classList.add("dark");
		else
			document.body.classList.remove("dark");
	},
})