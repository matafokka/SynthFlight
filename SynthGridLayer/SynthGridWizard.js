/**
 * Wizard for SynthGridLayer
 * @class
 * @extends L.ALS.Wizard
 */
L.ALS.SynthGridWizard = L.ALS.Wizard.extend( /** @lends L.ALS.SynthGridWizard.prototype */ {

	displayName: "gridLayerDefaultName",

	initialize: function () {
		L.ALS.Wizard.prototype.initialize.call(this);

		this.standardScales = {
			"1:1 000 000": [4, 6],
			"1:500 000": [2, 3],
			"1:300 000": [1 + 20 / 60, 2],
			"1:200 000": [40 / 60, 1],
			"1:100 000": [20 / 60, 30 / 60],
			"1:50 000": [10 / 60, 15 / 60],
			"1:25 000": [5 / 60, 7.5 / 60],
			"1:10 000": [2.5 / 60, (3 + 45 / 60) / 60],
			"1:5 000": [(1 + 15 / 60) / 60, (1 + 52.5 / 60) / 60],
			"1:2 000": [25 / 3600, 37.5 / 3600],
		}

		let dropDownList = new L.ALS.Widgets.DropDownList("gridStandardScales", "gridStandardScales", this, "onGridStandardScalesChange");
		for (let param in this.standardScales) {
			if (this.standardScales.hasOwnProperty(param))
				dropDownList.addItem(param);
		}
		dropDownList.addItem("Custom").selectItem("1:25 000");

		this.addWidgets(dropDownList,
			new L.ALS.Widgets.Number("gridLngDistance", "gridLngDistance").setMin(0.0001).setMax(180).setStep(0.001),
			new L.ALS.Widgets.Number("gridLatDistance", "gridLatDistance").setMin(0.0001).setMax(90).setStep(0.001),
			new L.ALS.Widgets.Checkbox("gridShouldMergeCells", "gridShouldMergeCells"),
			new L.ALS.Widgets.SimpleLabel("notificationLabel", "gridWizardNotification").setStyle("message")
		);
	},

	onGridStandardScalesChange: function (widget) {
		let value = widget.getValue();
		let latDistanceControl = this.getWidgetById("gridLatDistance");
		let lngDistanceControl = this.getWidgetById("gridLngDistance");

		let isEnabled = value === "Custom";
		if (!isEnabled) {
			let values = this.standardScales[value];
			latDistanceControl.setValue(values[0]);
			lngDistanceControl.setValue(values[1]);
		}

		latDistanceControl.setEnabled(isEnabled);
		lngDistanceControl.setEnabled(isEnabled);
	}
});