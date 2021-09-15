L.ALS.SynthBaseDrawLayer = L.ALS.SynthBaseLayer.extend({

	defaultName: "Draw Layer",

	/**
	 * Leaflet.Draw controls to use
	 */
	drawControls: {},

	init: function (wizardResults, settings) {

		this.addBaseParametersInputSection();
		this.addBaseParametersOutputSection();

		L.ALS.SynthBaseLayer.prototype.init.call(this);

		/**
		 * Leaflet.Draw group
		 * @type {L.FeatureGroup}
		 */
		this.drawingGroup = L.featureGroup();

		this.addLayers(this.drawingGroup);

		let options = {
			draw: {},
			edit: {
				featureGroup: this.drawingGroup,
				remove: true,
			}
		}

		let toDisable = ["circle", "circlemarker", "marker", "polygon", "polyline", "rectangle", "simpleshape"];

		for (let control of toDisable)
			options.draw[control] = false;
		for (let control in this.drawControls)
			options.draw[control] = this.drawControls[control];

		this.control = new L.Control.Draw(options);

		this.addEventListenerTo(this.map, "draw:created", "onDraw");
		this.onNameChange();
	},

	onSelect: function () {
		this.map.addControl(this.control);
	},

	onDeselect: function () {
		this.map.removeControl(this.control);
	},

	onDraw: function (e) {
		this.drawingGroup.addLayer(e.layer);
	}

})