/**
 * General application settings
 *
 * @class
 * @extends L.ALS.Settings
 */
L.ALS._service.GeneralSettings = L.ALS.Settings.extend( /** @lends L.ALS._service.GeneralSettings.prototype */ {

	/**
	 * Light theme radio button ID
	 * @type {string}
	 * @private
	 */
	_lightTheme: "generalSettingsLightTheme",

	/**
	 * Dark theme radio button ID
	 * @type {string}
	 * @private
	 */
	_darkTheme: "generalSettingsDarkTheme",

	/**
	 * System theme radio button ID
	 * @type {string}
	 * @private
	 */
	_systemTheme: "generalSettingsSystemTheme",

	/** @constructs */
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
		let themeWidget = new L.ALS.Widgets.RadioButtonsGroup("theme", "generalSettingsTheme", this, "changeTheme");
		for (let theme of [this._lightTheme, this._darkTheme])
			themeWidget.addItem(theme);

		// Check if prefers-color-scheme supported and add system theme to the themes list
		let defaultValue = this._lightTheme;
		let mediaQuery = "(prefers-color-scheme: dark)";
		if (window.matchMedia && window.matchMedia(mediaQuery).media === mediaQuery) {
			themeWidget.addItem(this._systemTheme);

			/**
			 * Media query to detect browser's theme
			 * @type {MediaQueryList|undefined}
			 * @private
			 */
			this._systemThemeMedia = window.matchMedia(mediaQuery);
			this._systemThemeMedia.addEventListener("change", () => {
				if (themeWidget.getValue() === this._systemTheme)
					this._changeThemeWorker(this._systemTheme);
			});
			defaultValue = this._systemTheme;
		}
		themeWidget.setAttributes({ defaultValue: defaultValue });

		// Add those widgets to this widgetable
		let widgets = [languageWidget, themeWidget];
		for (let widget of widgets)
			this.addWidget(widget);
	},

	/**
	 * Changes application's locale
	 * @param widget {L.ALS.Widgets.DropDownList}
	 */
	changeLocale: function (widget) {
		L.ALS.Locales.changeLocale(widget.getValue());
	},

	/**
	 * Changes application's theme
	 * @param widget {L.ALS.Widgets.RadioButtonsGroup}
	 */
	changeTheme: function (widget) {
		this._changeThemeWorker(widget.getValue());
	},

	/**
	 * Actually changes theme
	 * @param value {string} Theme name to set
	 * @private
	 */
	_changeThemeWorker: function (value) {
		if (value === this._systemTheme)
			this._changeThemeWorker(this._systemThemeMedia.matches ? this._darkTheme : this._lightTheme)
		else
			this._darkThemeSheet.disabled = (value !== this._darkTheme);
	},
})