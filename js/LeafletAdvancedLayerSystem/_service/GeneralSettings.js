L.ALS._service.GeneralSettings = L.ALS.Settings.extend({
	initialize: function () {
		L.ALS.Settings.prototype.initialize.call(this);

		let languageWidget = new L.ALS.Widgets.DropDownList("lang", "Language");
		for (let lang of ["English", "Gibberish", "Equestrian", "1337 5|>34|{"])
			languageWidget.addItem(lang);
		languageWidget.setAttributes({ defaultValue: "English" });

		let themeWidget = new L.ALS.Widgets.DropDownList("theme", "Theme");
		for (let theme of ["Light", "Dark", "System", "Time Range"])
			themeWidget.addItem(theme);
		themeWidget.setAttributes({ defaultValue: "System" });

		let widgets = [
			languageWidget, themeWidget,
			new L.ALS.Widgets.SimpleLabel("warning", "Warning: general settings are not implemented yet, they're here only for testing purposes. All other settings are working fine.", "justify", "warning")
		];

		for (let widget of widgets)
			this.addWidget(widget);
	}
})