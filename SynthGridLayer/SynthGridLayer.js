require("./SynthGridSettings.js");
require("./SynthGridWizard.js");
const turfHelpers = require("@turf/helpers");

/**
 * Layer that allows users to plan aerial photography using grid
 * @class
 * @extends L.ALS.Layer
 */
L.ALS.SynthGridLayer = L.ALS.SynthRectangleBaseLayer.extend(/** @lends L.ALS.SynthGridLayer.prototype */{

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
		this.gridLabelsIDs = [];

		L.ALS.SynthRectangleBaseLayer.prototype.init.call(this, wizardResults, settings);

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

		this.calculateParameters();
		this.writeToHistoryDebounced();
	},

	calculateParameters: function () {
		this._onMapZoom();
		L.ALS.SynthRectangleBaseLayer.prototype.calculateParameters.call(this);
	},

	/**
	 * Estimates paths count based on given cell size in degrees
	 * @param cellSizeDeg
	 * @returns {number}
	 */
	estimatePathsCount: function (cellSizeDeg) {
		return Math.ceil(
			turfHelpers.radiansToLength(turfHelpers.degreesToRadians(cellSizeDeg), "meters") /
			this.By
		);
	},

	drawPaths: function () {
		this.clearPaths();

		// Calculate estimated paths count for a polygon. Values are somewhat true for equatorial regions.
		// We'll check if it's too small (in near-polar regions, there'll be only one path when value is 2) or too big.

		let errorLabel = this.getWidgetById("calculateParametersError"),
			parallelsPathsCount = this.estimatePathsCount(this.lngPathsCount),
			meridiansPathsCount = this.estimatePathsCount(this.latPathsCount);

		if (parallelsPathsCount === undefined) {
			errorLabel.setValue("errorDistanceHasNotBeenCalculated");
			return;
		}

		if (parallelsPathsCount >= 20 || meridiansPathsCount >= 20) {
			errorLabel.setValue("errorPathsCountTooBig");
			return;
		}

		if (parallelsPathsCount <= 2 || meridiansPathsCount <= 2) {
			errorLabel.setValue("errorPathsCountTooSmall");
			return;
		}
		errorLabel.setValue("");

		L.ALS.SynthRectangleBaseLayer.prototype.drawPaths.call(this);
	},

	statics: {
		wizard: L.ALS.SynthGridWizard,
		settings: new L.ALS.SynthGridSettings(),
	}
});

require("./onMapPan.js");
require("./onMapZoom.js");
require("./mergePolygons.js");