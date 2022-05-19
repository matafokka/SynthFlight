/**
 * Settings for SynthGridLayer
 *
 * @class
 * @extends L.ALS.Settings
 */
L.ALS.SynthGridSettings = L.ALS.SynthPolygonBaseSettings.extend( /** @lends L.ALS.SynthGridSettings.prototype */ {

	initialize: function () {
		L.ALS.SynthPolygonBaseSettings.prototype.initialize.call(this);
		this.addColorWidgets("defaultGridBorderColor", "defaultGridFillColor");
		this.addWidget(new L.ALS.Widgets.Number("gridHidingFactor", "gridHidingFactor").setMin(1).setMax(10).setValue(5), 5);
	}

});