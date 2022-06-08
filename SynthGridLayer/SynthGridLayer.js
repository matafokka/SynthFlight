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

		this.polygons = {};

		/**
		 * Whether or not cells above 60 lat should be merged
		 * @type {boolean}
		 */
		this.shouldMergeCells = wizardResults.gridShouldMergeCells;

		L.ALS.SynthRectangleBaseLayer.prototype.init.call(this, wizardResults, settings);

		this.addEventListenerTo(this.map, "zoomend", "_onMapZoom");
		this.addEventListenerTo(this.map, "moveend resize", "_onMapPan");
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

		this.updatePathsMeta();
	},

	forEachValidPolygon: function (cb) {
		for (let id in this.polygons)
			cb(this.polygons[id]);
	},

	initPolygon: function (lat, lng, lngDistance) {
		let polygon = new L.Rectangle([
			[lat, lng],
			[lat + this.latDistance, lng + lngDistance],
		]),
			name = this.generatePolygonName(polygon);

		return this.polygons[name] ? this.polygons[name] : this.initPolygonStyleAndEvents(polygon);
	},

	initPolygonStyleAndEvents: function (polygon, isSelected = false) {
		let name = this.generatePolygonName(polygon);

		polygon.setStyle({
			color: this.borderColor,
			fillColor: this.fillColor,
			fill: false,
			weight: this.lineThicknessValue
		});

		let select = () => {
			polygon.setStyle({fill: true});
			this.polygons[name] = polygon;
			this.addPolygon(polygon);
		}

		polygon.on("dblclick contextmenu", () => {
			if (this.polygons[name]) {
				polygon.setStyle({fill: false});
				delete this.polygons[name];
				this.removePolygon(polygon);
			} else
				select();

			this.calculateParameters();
			this.writeToHistoryDebounced();
		});

		this.polygonGroup.addLayer(polygon);

		if (isSelected)
			select();

		return polygon;
	},

	/**
	 * Generates polygon name for adding into this.polygons
	 * @param polygon Polygon to generate name for
	 * @return {string} Name for given polygon
	 * @protected
	 */
	generatePolygonName: function (polygon) {
		let {lat, lng} = polygon.getBounds().getNorthWest();
		return "p_" + this.toFixed(lat) + "_" + this.toFixed(lng);
	},

	statics: {
		wizard: L.ALS.SynthGridWizard,
		settings: new L.ALS.SynthGridSettings(),
	}
});

require("./onMapPan.js");
require("./onMapZoom.js");
require("./mergePolygons.js");
require("./serialization.js");