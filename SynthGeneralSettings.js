/**
 * Whether SynthFlight should notify user when DEM is loaded or map objects are edited
 * @type {boolean}
 */
L.ALS.generalSettings.notificationsEnabled = true;

L.ALS.SynthGeneralSettings = L.ALS.GeneralSettings.extend({
	initialize: function (defaultLocale) {
		L.ALS.GeneralSettings.prototype.initialize.call(this, defaultLocale);
		this.removeWidget("notify");
		this.addWidget(new L.ALS.Widgets.Checkbox("notify", "generalSettingsDisableAnnoyingNotification", this, "_changeNotifications"), false);
	},

	_changeNotifications: function (widget) {
		let value = !widget.getValue();
		L.ALS.generalSettings.notifyWhenLongRunningOperationComplete = value;
		L.ALS.generalSettings.notificationsEnabled = value;
	}
})