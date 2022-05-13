require("./SynthGridSettings.js");
require("./SynthGridWizard.js");
const MathTools = require("../MathTools.js");
const turfHelpers = require("@turf/helpers");

/**
 * Layer that allows users to plan aerial photography using grid
 * @class
 * @extends L.ALS.SynthRectangleBaseLayer
 */
L.ALS.SynthGridLayer = L.ALS.SynthRectangleBaseLayer.extend(/** @lends L.ALS.SynthGridLayer.prototype */{

	defaultName: "Grid Layer",
	useZoneNumbers: true,
	borderColorLabel: "gridBorderColor",
	fillColorLabel: "gridFillColor",
	writeToHistoryOnInit: false,

	init: function (wizardResults, settings, fn) {
		// Verify that distances split map into whole number of segments. If not, ask user if they want to use corrected
		// distances.

		// Distances don't divide Earth into the whole number of segments.
		// Would you like to use <value> for parallels and <value> for meridians?
		let confirmText = L.ALS.locale.gridCorrectDistancesMain1 + "\n\n" + L.ALS.locale.gridCorrectDistancesMain2,
			shouldAlert = false;

		for (let name of ["Lat", "Lng"]) {
			let wizardDistanceName = `grid${name}Distance`,
				userDistance = parseFloat(wizardResults[wizardDistanceName]),
				correctedDistance = 360 / Math.round(360 / userDistance);

			if (MathTools.isEqual((360 / userDistance) % 1, 0))
				continue;

			shouldAlert = true;
			wizardResults[wizardDistanceName] = correctedDistance;
			confirmText += ` ${correctedDistance}° ` +
				L.ALS.locale[`gridCorrectDistances${name}`] + ` ${L.ALS.locale.gridCorrectDistancesAnd}`;
		}

		if (shouldAlert) {
			confirmText = confirmText.substring(0, confirmText.lastIndexOf(" " + L.ALS.locale.gridCorrectDistancesAnd)) + "?" +
				"\n\n" + L.ALS.locale.gridCorrectDistancesMain3;

			if (!window.confirm(confirmText)) {
				fn();
				return;
			}
		}

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
			parallelsPathsCount = this.estimatePathsCount(this.lngDistance),
			meridiansPathsCount = this.estimatePathsCount(this.latDistance);

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