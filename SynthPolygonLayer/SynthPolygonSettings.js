/**
 * Settings for SynthGridLayer
 *
 * @class
 * @extends L.ALS.Settings
 */
L.ALS.SynthPolygonSettings = L.ALS.SynthPolygonBaseSettings.extend( /** @lends L.ALS.SynthRectangleSettings.prototype */ {

	initialize: function () {
		L.ALS.SynthPolygonBaseSettings.prototype.initialize.call(this);
		this.addColorWidgets("defaultRectangleBorderColor", "defaultRectangleFillColor", false);
	}

});