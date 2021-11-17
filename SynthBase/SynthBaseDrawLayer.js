/**
 * Base class for L.Draw layers
 * @param settings {SettingsObject} Settings object
 * @param colorLabel {string} Color widget label for paths group
 */
L.ALS.SynthBaseDrawLayer = L.ALS.SynthBaseLayer.extend({

	defaultName: "Draw Layer",

	init: function (settings, colorLabel) {

		/**
		 * Leaflet.Draw controls to use
		 */
		this.drawControls = this.drawControls || {}

		/**
		 * Leaflet.Draw group
		 * @type {L.FeatureGroup}
		 */
		this.drawingGroup = L.featureGroup();

		this.connectionsGroup = L.featureGroup();

		this._drawOptions = {
			draw: {},
			edit: {
				featureGroup: this.drawingGroup,
				remove: true,
			}
		}

		let toDisable = ["circle", "circlemarker", "marker", "polygon", "polyline", "rectangle", "simpleshape"];

		for (let control of toDisable)
			this._drawOptions.draw[control] = false;

		for (let control in this.drawControls)
			this._drawOptions.draw[control] = this.drawControls[control];

		this.control = new L.Control.Draw(this._drawOptions);

		L.ALS.SynthBaseLayer.prototype.init.call(this, settings, this.drawingGroup, this.connectionsGroup, colorLabel);
		this.updateDrawThickness();
		this.addEventListenerTo(this.map, "draw:created", "onDraw");
		this.onNameChange();
		this.addControl(this.control, "top", "topleft");
	},

	onDraw: function (e) {
		this.drawingGroup.addLayer(e.layer);
	},

	setLineThickness: function (widget) {
		L.ALS.SynthBaseLayer.prototype.setLineThickness.call(this, widget);
		this.updateDrawThickness();
	},

	updateDrawThickness: function () {
		try {
			this._drawOptions.draw.polyline.shapeOptions.weight = this.lineThicknessValue;
		} catch (e) {}
	}

})