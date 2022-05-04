// This file contains class definitions and menu. For other stuff, see other files in this directory.

const MathTools = require("../MathTools.js");
const turfHelpers = require("@turf/helpers");
require("../SynthPolygonBaseLayer/SynthPolygonBaseSettings.js");

/**
 * Base layer for rectangle-based planning
 *
 * @class
 * @extends L.ALS.SynthPolygonBaseLayer
 */
L.ALS.SynthRectangleBaseLayer = L.ALS.SynthPolygonBaseLayer.extend( /** @lends L.ALS.SynthRectangleBaseLayer.prototype */ {

	_currentStandardScale: -1,
	useRect: true,
	borderColorLabel: "",
	fillColorLabel: "",

	init: function (wizardResults, settings) {
		this.copySettingsToThis(settings);


		// To optimize the grid and reduce visual clutter, let's:
		// 1. Display only visible polygons. If we'll render the whole thing, user will need from couple of MBs to TBs of RAM.
		// 2. Hide grid when it'll contain a lot of polygons and becomes messy
		// Additional redrawing actually won't introduce any noticeable delay.

		// Create empty groups containing our stuff. Yeah, I hate copying too, but I want code completion :D
		this.latPointsGroup = L.featureGroup();
		this.lngPointsGroup = L.featureGroup();

		this.pathsByParallels = L.featureGroup();
		this.parallelsInternalConnections = L.featureGroup();
		this.parallelsExternalConnections = L.featureGroup();

		this.pathsByMeridians = L.featureGroup();
		this.meridiansInternalConnections = L.featureGroup();
		this.meridiansExternalConnections = L.featureGroup();

		L.ALS.SynthPolygonBaseLayer.prototype.init.call(this, settings,
			// Parallels args
			this.parallelsInternalConnections,
			this.parallelsExternalConnections,
			this.pathsByParallels,
			this.lngPointsGroup,
			"parallelsColor",
			"hidePathsByParallels",

			// Meridians args
			this.meridiansInternalConnections,
			this.meridiansExternalConnections,
			this.pathsByMeridians,
			this.latPointsGroup,
			"meridiansColor",
			"hidePathsByMeridians",
		);

		/**
		 * Contains paths' labels' IDs
		 * @type {string[]}
		 * @private
		 */
		this.pathsLabelsIds = [];

		this.lngDistance = parseFloat(wizardResults["gridLngDistance"]);
		this.latDistance = parseFloat(wizardResults["gridLatDistance"]);

		// Determine whether this grid uses standard scale or not
		let scale = wizardResults.gridStandardScales;
		if (scale && scale !== "Custom") {
			let scaleWithoutSpaces = "";
			for (let i = 2; i < scale.length; i++) {
				let char = scale[i];
				if (char === " ")
					continue;
				scaleWithoutSpaces += char;
			}
			this._currentStandardScale = parseInt(scaleWithoutSpaces);
			this.setName(`${this.defaultName}, ${scale}`);
		} else
			this._currentStandardScale = Infinity;
		this.calculateThreshold(settings); // Update hiding threshold

		this.calculateParameters();
		this.getWidgetById("hideCapturePoints").callCallback();
	},

	// It overrides parent method, my IDE can't see it
	getPathLength: function (layer) {
		// Basically, inverse of L.ALS.SynthBaseLayer#getArcAngleByLength
		let latLngs = layer instanceof Array ? layer : layer.getLatLngs(), length = 0;

		for (let i = 0; i < latLngs.length - 1; i += 2) {
			// Path length
			let p1 = latLngs[i], p2 = latLngs[i + 1], connP = latLngs[i + 2];
			length += this.getParallelOrMeridianLineLength(p1, p2);

			// Connection length
			if (connP)
				length += this.getParallelOrMeridianLineLength(p2, connP);
		}
		return length;
	},

	getParallelOrMeridianLineLength: function (p1, p2, useFlightHeight = true) {
		let r = this.getEarthRadius(useFlightHeight), {x, y} = MathTools.getXYPropertiesForPoint(p1),
			p1Y = p1[y], lngDiff = Math.abs(p1[x] - p2[x]);

		// By meridians
		if (lngDiff <= MathTools.precision)
			return r * turfHelpers.degreesToRadians(Math.abs(p1Y - p2[y]));

		// By parallels
		let angle = turfHelpers.degreesToRadians(90 - Math.abs(p1Y));
		return turfHelpers.degreesToRadians(lngDiff) * Math.sin(angle) * r;
	}

});

require("./drawPaths.js");
require("./misc.js");
require("./serialization.js");
require("./toGeoJSON.js");