/**
 * Settings for SynthGridLayer
 *
 * @class
 * @extends L.ALS.Settings
 */
L.ALS.SynthRectangleSettings = L.ALS.SynthPolygonSettings.extend( /** @lends L.ALS.SynthRectangleSettings.prototype */ {

	initialize: function () {
		L.ALS.SynthPolygonSettings.prototype.initialize.call(this);
		this.addColorWidgets("defaultRectangleBorderColor", "defaultRectangleFillColor");
	}

});