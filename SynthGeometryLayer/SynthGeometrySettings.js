/**
 * Settings for SynthShapefile
 *
 * @class
 * @extends L.ALS.Settings
 */
L.ALS.SynthGeometrySettings = L.ALS.Settings.extend( /** @lends L.ALS.SynthGeometrySettings.prototype */ {

	/**
	 * Polygons' fill color
	 * @type {string}
	 */
	fillColor: "#ff9900",

	/**
	 * Objects' border color
	 * @type {string}
	 */
	borderColor: "#8d4200",

	initialize: function () {
		L.ALS.Settings.prototype.initialize.call(this);

		this.addWidget(
			(new L.ALS.Widgets.Color("fillColor", "geometryDefaultFillColor")).setValue(this.fillColor),
			this.fillColor
		);

		this.addWidget(
			(new L.ALS.Widgets.Color("borderColor", "geometryDefaultBorderColor")).setValue(this.borderColor),
			this.borderColor
		);
	}

});