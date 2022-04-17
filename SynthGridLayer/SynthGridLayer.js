require("./SynthGridSettings.js");
require("./SynthGridWizard.js");

/**
 * Layer that allows users to plan aerial photography using grid
 * @class
 * @extends L.ALS.Layer
 */
L.ALS.SynthGridLayer = L.ALS.SynthPolygonLayer.extend(/** @lends L.ALS.SynthGridLayer.prototype */{

	defaultName: "Grid Layer",
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

		/**
		 * Whether or not cells above 60 lat should be merged
		 * @type {boolean}
		 */
		this.shouldMergeCells = wizardResults.gridShouldMergeCells;

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
		this.writeToHistoryDebounced();
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