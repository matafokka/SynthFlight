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

		let fillColor = new L.ALS.Widgets.Color("fillColor", "shapefileDefaultFillColor");
		fillColor.setAttributes({
			value: this.fillColor,
			defaultValue: this.fillColor
		});

		let borderColor = new L.ALS.Widgets.Color("borderColor", "shapefileDefaultBorderColor");
		borderColor.setAttributes({
			value: this.borderColor,
			defaultValue: this.borderColor
		});

		for (let widget of [fillColor, borderColor])
			this.addWidget(widget);
	}

});