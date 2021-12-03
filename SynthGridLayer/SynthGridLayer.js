require("./SynthGridSettings.js");
require("./SynthGridWizard.js");

/**
 * Layer that allows users to plan aerial photography using grid
 * @class
 * @extends L.ALS.Layer
 */
L.ALS.SynthGridLayer = L.ALS.SynthPolygonLayer.extend({

	defaultName: "Grid Layer",
	_alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
	useZoneNumbers: true,
	borderColorLabel: "gridBorderColor",
	fillColorLabel: "gridFillColor",

	init: function (wizardResults, settings) {

		/**
		 * Contains polygons' names' IDs
		 * @type {string[]}
		 * @private
		 */
		this._namesIDs = [];

		L.ALS.SynthPolygonLayer.prototype.init.call(this, wizardResults, settings);

		this.addEventListenerTo(this.map, "zoomend", "_onMapZoom");
		this.addEventListenerTo(this.map, "moveend resize", "_onMapPan");
	},

	/**
	 * Selects or deselects polygon upon double click and redraws flight paths
	 * @param event
	 */
	_selectOrDeselectPolygon: function (event) {
		let polygon = event.target, name = this._generatePolygonName(polygon);

		if (this.polygons[name]) {
			polygon.setStyle({fill: false});
			this.removePolygon(polygon);
		} else
			this.addPolygon(polygon);

		this.updateAll();
		this.writeToHistory();
	},

	updateAll: function () {
		this._onMapZoom();
		L.ALS.SynthPolygonLayer.prototype.updateAll.call(this);
	},

	statics: {
		wizard: L.ALS.SynthGridWizard,
		settings: new L.ALS.SynthGridSettings(),
	}
});

require("./onMapPan.js");
require("./onMapZoom.js");
require("./mergePolygons.js");