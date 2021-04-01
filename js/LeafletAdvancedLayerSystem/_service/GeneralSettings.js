L.ALS._service.GeneralSettings = L.ALS.Settings.extend({
	initialize: function () {
		L.ALS.Settings.prototype.initialize.call(this);

		let languageWidget = new L.ALS.Widgets.DropDownList("lang", "generalSettingsLanguage", this, "changeLocale");
		for (let locale in L.ALS.Locales) {
			if (L.ALS.Locales.hasOwnProperty(locale) && typeof L.ALS.Locales[locale] !== "function")
				languageWidget.addItem(locale);
		}
		languageWidget.setAttributes({ defaultValue: "English" });
		this.addWidget(languageWidget);

		// TODO: Uncomment it when themes will be ready
		/*let themeWidget = new L.ALS.Widgets.DropDownList("theme", "generalSettingsTheme");
		for (let theme of ["Light", "Dark", "System", "Time Range"])
			themeWidget.addItem(theme);
		themeWidget.setAttributes({ defaultValue: "System" });

		let widgets = [languageWidget, themeWidget];

		for (let widget of widgets)
			this.addWidget(widget);*/
	},

	changeLocale: function (widget) {
		L.ALS.Locales.changeLocale(widget.getValue());
	},

})