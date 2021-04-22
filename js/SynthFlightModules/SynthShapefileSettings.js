/**
 * Settings for SynthShapefile
 *
 * @class
 * @extends L.ALS.Settings
 */
L.ALS.SynthShapefileSettings = L.ALS.Settings.extend( /** @lends L.ALS.SynthShapefileSettings.prototype */ {

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

	/** @constructs */
	initialize: function () {
		L.ALS.Settings.prototype.initialize.call(this);

		this.addWidget(
			(new L.ALS.Widgets.Color("fillColor", "shapefileDefaultFillColor")).setValue(this.fillColor),
			this.fillColor
		);

		this.addWidget(
			(new L.ALS.Widgets.Color("borderColor", "shapefileDefaultBorderColor")).setValue(this.borderColor),
			this.borderColor
		);
	}

});