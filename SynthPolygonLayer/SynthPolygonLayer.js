// This file contains class definitions and menu. For other stuff, see other files in this directory.

const MathTools = require("../MathTools.js");
const turfHelpers = require("@turf/helpers");
require("./SynthPolygonSettings.js");
let GeoTIFFParser;
try {
	GeoTIFFParser = require("../GeoTIFFParser.js");
} catch (e) {
}

/**
 * Base layer for rectangle-based planning
 *
 * @class
 * @extends L.ALS.SynthBaseLayer
 */
L.ALS.SynthPolygonLayer = L.ALS.SynthBaseLayer.extend( /** @lends L.ALS.SynthPolygonLayer.prototype */ {

	_currentStandardScale: -1,

	borderColorLabel: "",
	fillColorLabel: "",

	useZoneNumbers: false,

	/**
	 * Indicates whether the grid is displayed or not.
	 * @type {boolean}
	 */
	isDisplayed: true,

	_doHidePolygonWidgets: false,
	_doHidePathsNumbers: false,

	init: function (wizardResults, settings) {
		this.copySettingsToThis(settings);

		this.polygons = {};
		this.polygonsWidgets = {};
		this.serializationIgnoreList.push("polygons", "lngDistance", "latDistance", "_currentStandardScale");


		// To optimize the grid and reduce visual clutter, let's:
		// 1. Display only visible polygons. If we'll render the whole thing, user will need from couple of MBs to TBs of RAM.
		// 2. Hide grid when it'll contain a lot of polygons and becomes messy
		// Additional redrawing actually won't introduce any noticeable delay.

		// Create empty groups containing our stuff. Yeah, I hate copying too, but I want code completion :D

		this.polygonGroup = L.featureGroup();
		this.widgetsGroup = L.featureGroup();
		this.bordersGroup = L.featureGroup();
		this.bordersGroup.thicknessMultiplier = 4;
		this.latPointsGroup = L.featureGroup();
		this.lngPointsGroup = L.featureGroup();
		this.labelsGroup = new L.LabelLayer(false);

		this.pathsByParallels = L.featureGroup();
		this.parallelsInternalConnections = L.featureGroup();
		this.parallelsExternalConnections = L.featureGroup();

		this.pathsByMeridians = L.featureGroup();
		this.meridiansInternalConnections = L.featureGroup();
		this.meridiansExternalConnections = L.featureGroup();

		this.addLayers(this.polygonGroup, this.widgetsGroup, this.bordersGroup, this.latPointsGroup, this.lngPointsGroup, this.labelsGroup);

		L.ALS.SynthBaseLayer.prototype.init.call(this, settings,
			this.parallelsInternalConnections, this.parallelsExternalConnections, "parallelsColor", [this.pathsByParallels],
			this.meridiansInternalConnections, this.meridiansExternalConnections, "meridiansColor", [this.pathsByMeridians]
		);

		this.toUpdateThickness.push(this.polygonGroup, this.bordersGroup, this.latPointsGroup, this.lngPointsGroup);

		/**
		 * Contains paths' labels' IDs
		 * @type {string[]}
		 * @private
		 */
		this._pathsLabelsIDs = [];

		let DEMFilesLabel = "DEMFiles";
		if (!GeoTIFFParser)
			DEMFilesLabel = "DEMFilesWhenGeoTIFFNotSupported";
		if (L.ALS.Helpers.isIElte9)
			DEMFilesLabel = "DEMFilesIE9";

		this.addWidgets(
			new L.ALS.Widgets.Checkbox("hidePolygonWidgets", "hidePolygonWidgets", this, "_updateLayersVisibility"),
			new L.ALS.Widgets.Checkbox("hideNumbers", "hideNumbers", this, "_updateLayersVisibility"),
			new L.ALS.Widgets.Checkbox("hideCapturePoints", "hideCapturePoints", this, "_updateLayersVisibility").setValue(true),
			new L.ALS.Widgets.Checkbox("hidePathsConnections", "hidePathsConnections", this, "_updateLayersVisibility"),
			new L.ALS.Widgets.Checkbox("hidePathsByMeridians", "hidePathsByMeridians", this, "_updateLayersVisibility"),
			new L.ALS.Widgets.Checkbox("hidePathsByParallels", "hidePathsByParallels", this, "_updateLayersVisibility")
		);
		this.addWidgets(
			new L.ALS.Widgets.Color("borderColor", this.borderColorLabel, this, "_setColor").setValue(this.borderColor),
			new L.ALS.Widgets.Color("fillColor", this.fillColorLabel, this, "_setColor").setValue(this.fillColor),
		);

		this.addBaseParametersInputSection();

		this.addWidgets(
			new L.ALS.Widgets.File("DEMFiles", DEMFilesLabel, this, "onDEMLoad").setMultiple(true),
			new L.ALS.Widgets.Divider("div3"),
			new L.ALS.Widgets.ValueLabel("selectedArea", "selectedArea", "sq.m.").setNumberOfDigitsAfterPoint(0).setFormatNumbers(true),
		);

		this.addBaseParametersOutputSection();

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
		} else
			this._currentStandardScale = Infinity;
		this.calculateThreshold(settings); // Update hiding threshold

		this.updateAll();
		this.getWidgetById("hideCapturePoints").callCallback();
	},

	// TODO: I don't remember what this is for, use it or remove it
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
		let r = this._getEarthRadius(useFlightHeight), {x, y} = MathTools.getXYPropertiesForPoint(p1),
			p1Y = p1[y], lngDiff = Math.abs(p1[x] - p2[x]);

		// By meridians
		if (lngDiff <= MathTools.precision)
			return r * turfHelpers.degreesToRadians(Math.abs(p1Y - p2[y]));

		// By parallels
		let angle = turfHelpers.degreesToRadians(90 - Math.abs(p1Y));
		return turfHelpers.degreesToRadians(lngDiff) * Math.sin(angle) * r;
	}

});

require("./DEM.js");
require("./drawPaths.js");
require("./misc.js");
require("./polygons.js");
require("./serialization.js");
require("./toGeoJSON.js");