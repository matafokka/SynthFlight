require("./SynthBaseSettings.js");
const turfHelpers = require("@turf/helpers");
const MathTools = require("../MathTools.js");
const debounce = require("debounce");

/**
 * @typedef {Object} PathData
 * @property {L.FeatureGroup} pathGroup Group with the path
 * @property {L.FeatureGroup} connectionsGroup Group with the connections
 * @property {string} colorLabel Label for the color input
 * @property {L.Layer[]} toUpdateColors Layers to update colors of
 */

/**
 * Base layer. Provides airport markers, basic calculations and menu entries for them.
 *
 * Call {@link L.ALS.SynthBaseLayer#init} after you've created a menu!
 *
 * @param settings {SettingsObject} Settings object
 * @param pathGroup1 {L.FeatureGroup} First paths group (a group of polylines)
 * @param connectionsGroup1 {L.FeatureGroup} First connections group
 * @param colorLabel1 {string} Color widget label for paths group 1
 * @param path1AdditionalLayers {L.Layer[]} Additional layers related to path 1 that should have same color and thickness
 * @param pathGroup2 {L.FeatureGroup} Second paths group (a group of polylines). If you have only one path, leave this one as undefined.
 * @param connectionsGroup2 {L.FeatureGroup} Second connections group. If you have only one path, leave this one as undefined.
 * @param colorLabel2 {string} Color widget label for paths group 2. If you have only one path, leave this one as undefined.
 * @param path2AdditionalLayers {L.Layer[]} Additional layers related to path 2 that should have same color and thickness
 *
 * @class
 * @extends L.ALS.Layer
 */
L.ALS.SynthBaseLayer = L.ALS.Layer.extend(/** @lends L.ALS.SynthBaseLayer.prototype */ {

	/**
	 * Parameter to pass to dashArray option
	 * @type {string}
	 */
	dashedLine: "4 4",

	isAfterDeserialization: false,

	/**
	 * Indicates whether this layer has Y overlay, i.e. if it has parallel paths
	 * @type {boolean}
	 */
	hasYOverlay: true,

	init: function (
		settings,
		// Path 1 args
		pathGroup1,
		connectionsGroup1,
		colorLabel1,
		path1AdditionalLayers = [],

		// Path 2 args
		pathGroup2 = undefined,
		connectionsGroup2 = undefined,
		colorLabel2 = undefined,
		path2AdditionalLayers = []
	) {

		/**
		 * {@link L.ALS.Layer#writeToHistory} but debounced for use in repeated calls
		 * @type {function()}
		 */
		this.writeToHistoryDebounced = debounce(() => {
			if (!this.isAfterDeserialization)
				this.writeToHistory()
		}, 300);

		/**
		 * Settings passed from ALS
		 * @type {Object}
		 * @private
		 */
		this._settings = settings;

		/**
		 * For numbering paths widgets
		 * @type {number}
		 * @private
		 */
		this._pathsWidgetsNumber = 1;

		/**
		 * Data related to the first path
		 * @type PathData
		 */
		this.path1 = {
			pathGroup: pathGroup1,
			connectionsGroup: connectionsGroup1,
			colorLabel: colorLabel1,
			toUpdateColors: [pathGroup1, connectionsGroup1, ...path1AdditionalLayers]
		}

		/**
		 * Data related to the second path
		 * @type PathData
		 */
		this.path2 = pathGroup2 ? {
			pathGroup: pathGroup2,
			connectionsGroup: connectionsGroup2,
			colorLabel: colorLabel2,
			toUpdateColors: [pathGroup2, connectionsGroup2, ...path2AdditionalLayers]
		} : undefined;

		/**
		 * Array of paths to work with
		 * @type {PathData[]}
		 */
		this.paths = [this.path1];

		if (this.path2)
			this.paths.push(this.path2);

		/**
		 * Current line thickness value
		 * @type {number}
		 */
		this.lineThicknessValue = settings.lineThicknessValue;

		/**
		 * Groups to update line thickness of. To set double thickness, create thicknessMultiplier property in layer to control how thick should be line relative to thickness set by user.
		 *
		 * Already contains paths and connections groups
		 *
		 * @type {L.FeatureGroup[]}
		 */
		this.toUpdateThickness = [];

		for (let arr of [path1AdditionalLayers, path2AdditionalLayers]) {
			for (let item of arr) {
				if (item !== undefined)
					this.toUpdateThickness.push(item);
			}
		}

		for (let i = 0; i < this.paths.length; i++) {
			let path = this.paths[i];
			path.hullConnection = new L.Geodesic([[0, 0], [0, 0]], this.getConnectionLineOptions(settings[`color${i}`]));
			this.addLayers(path.pathGroup, path.connectionsGroup);
			this.toUpdateThickness.push(path.pathGroup, path.connectionsGroup);
		}

		this.serializationIgnoreList.push("_airportMarker", "toUpdateThickness", "writeToHistoryDebounced");

		/**
		 * Properties to copy to GeoJSON when exporting
		 * @type {string[]}
		 */
		this.propertiesToExport = ["cameraWidth", "cameraHeight", "pixelWidth", "focalLength", "flightHeight", "overlayBetweenPaths", "overlayBetweenImages", "imageScale", "ly", "Ly", "By", "lx", "Lx", "Bx", "GSI", "IFOV", "GIFOV", "FOV", "GFOV", "timeBetweenCaptures"];

		// Add airport
		let icon = L.divIcon({
			iconSize: null,
			className: "",
			html: "<div class='grd-lyr-airport-icon ri ri-flight-takeoff-line'></div>"
		})

		/**
		 * Airport marker
		 * @protected
		 */
		this._airportMarker = new L.Marker(this.map.getCenter(), {
			icon: icon,
			draggable: true
		});

		// Set inputs' values to new ones on drag
		this.addEventListenerTo(this._airportMarker, "drag", "onMarkerDrag");
		this.addLayers(this._airportMarker);
	},

	/**
	 * Adds basic parameters' widgets to the menu. Should be called at the constructor!
	 */
	addBaseParametersInputSection: function () {
		this.addWidget(
			new L.ALS.Widgets.Number("lineThickness", "lineThickness", this, "setLineThickness").setMin(1).setMax(20).setValue(this._settings.lineThicknessValue),
		);

		for (let i = 0; i < this.paths.length; i++)
			this.addWidget(new L.ALS.Widgets.Color(`color${i}`, this.paths[i].colorLabel, this, "_setPathsColor").setValue(this._settings[`color${i}`]));

		this.addWidgets(
			new L.ALS.Widgets.Divider("div1"),

			new L.ALS.Widgets.DropDownList("connectionMethod", "connectionMethod", this, "updatePathsMeta").addItems("allIntoOne", "oneFlightPerPath"),

			new L.ALS.Widgets.Number("airportLat", "airportLat", this, "setAirportLatLng").setMin(-90).setMax(90).setStep(0.01),
			new L.ALS.Widgets.Number("airportLng", "airportLng", this, "setAirportLatLng").setMin(-180).setMax(180).setStep(0.01),
			new L.ALS.Widgets.Number("aircraftSpeed", "aircraftSpeed", this, "calculateParameters").setMin(1).setStep(1).setValue(350),
			new L.ALS.Widgets.Number("imageScale", "imageScale", this, "calculateParameters").setMin(1).setStep(1).setValue(25000),

			new L.ALS.Widgets.Number("cameraWidth", "cameraWidth", this, "calculateParameters").setMin(1).setStep(1).setValue(17000),
			new L.ALS.Widgets.Number("cameraHeight", "cameraHeight", this, "calculateParameters").setMin(1).setStep(1).setValue(17000),
			new L.ALS.Widgets.Number("pixelWidth", "pixelWidth", this, "calculateParameters").setMin(0.1).setStep(0.1).setValue(5),
		);

		if (this.hasYOverlay)
			this.addWidget(new L.ALS.Widgets.Number("overlayBetweenPaths", "overlayBetweenPaths", this, "calculateParameters").setMin(60).setMax(100).setStep(0.1).setValue(60));

		this.addWidgets(
			new L.ALS.Widgets.Number("overlayBetweenImages", "overlayBetweenImages", this, "calculateParameters").setMin(30).setMax(100).setStep(0.1).setValue(30),
			new L.ALS.Widgets.Number("focalLength", "focalLength", this, "calculateParameters").setMin(0.001).setStep(1).setValue(112),

			new L.ALS.Widgets.SimpleLabel("calculateParametersError").setStyle("error"),
			new L.ALS.Widgets.SimpleLabel("cameraParametersWarning").setStyle("warning"),

			new L.ALS.Widgets.Divider("div2"),
		);
		this._airportMarker.fire("drag"); // Just to set values
	},

	/**
	 * Adds basic parameters' widgets to the menu. Should be called at the constructor!
	 */
	addBaseParametersOutputSection: function () {
		let yWidgets = [];
		if (this.hasYOverlay)
			yWidgets = [new L.ALS.Widgets.ValueLabel("By", "By", "m")];

		let valueLabels = [
			new L.ALS.Widgets.ValueLabel("flightHeight", "flightHeight", "m"),
			new L.ALS.Widgets.ValueLabel("lx", "lx", "m"),
			new L.ALS.Widgets.ValueLabel("Lx", "Lx", "m"),
			new L.ALS.Widgets.ValueLabel("Bx", "Bx", "m"),
			new L.ALS.Widgets.ValueLabel("ly", "ly", "m"),
			new L.ALS.Widgets.ValueLabel("Ly", "Ly", "m"),
			...yWidgets,
			new L.ALS.Widgets.ValueLabel("timeBetweenCaptures", "timeBetweenCaptures", "s"),
			new L.ALS.Widgets.ValueLabel("GSI", "GSI", "m"),
			new L.ALS.Widgets.ValueLabel("IFOV", "IFOV", "μrad"),
			new L.ALS.Widgets.ValueLabel("GIFOV", "GIFOV", "m"),
			new L.ALS.Widgets.ValueLabel("FOV", "FOV", "deg"),
			new L.ALS.Widgets.ValueLabel("GFOV", "GFOV", "m"),
		];

		for (let widget of valueLabels) {
			widget.setFormatNumbers(true);
			this.addWidget(widget);
		}
		this.pathsDetailsSpoiler = new L.ALS.Widgets.Spoiler("pathsDetails", "pathsSpoilerTitle");
		this.addWidget(this.pathsDetailsSpoiler);
	},

	/**
	 * Sets line thickness of whatever's in {@link L.ALS.SynthBaseLayer#toUpdateThickness}
	 * @param widget {L.ALS.Widgets.Number} Widget that controls line thickness
	 */
	setLineThickness: function (widget) {
		this.lineThicknessValue = widget.getValue();
		let doubleThickness = this.lineThicknessValue * 2;

		for (let group of this.toUpdateThickness) {
			group.eachLayer((layer) => {
				if (layer instanceof L.Polyline || layer instanceof L.Polygon)
					layer.setStyle({weight: (layer.thicknessMultiplier || group.thicknessMultiplier || 1) * this.lineThicknessValue});
				else if (layer instanceof L.CircleMarker)
					layer.setRadius(doubleThickness);
			})
		}
		this.updateDrawThickness();
	},

	/**
	 * Sets paths' colors, i.e. colors of layers in {@link PathData.toUpdateColors}
	 * @private
	 */
	_setPathsColor: function () {
		for (let i = 0; i < this.paths.length; i++) {
			let color = this.getWidgetById(`color${i}`).getValue(),
				style = {fillColor: color, color},
				path = this.paths[i];
			for (let group of path.toUpdateColors)
				group.setStyle(style);
		}
	},

	setAirportLatLng: function () {
		let latWidget = this.getWidgetById("airportLat"), lngWidget = this.getWidgetById("airportLng"),
			fixedLatLng = this._limitAirportPos(latWidget.getValue(), lngWidget.getValue());

		latWidget.setValue(fixedLatLng.lat);
		lngWidget.setValue(fixedLatLng.lng);
		this._airportMarker.setLatLng(fixedLatLng);
		this.connectToAirport();
	},

	onMarkerDrag: function () {
		let latLng = this._airportMarker.getLatLng(),
			fixedLatLng = this._limitAirportPos(latLng.lat, latLng.lng);
		this._airportMarker.setLatLng(fixedLatLng);
		this.getWidgetById("airportLat").setValue(fixedLatLng.lat.toFixed(5));
		this.getWidgetById("airportLng").setValue(fixedLatLng.lng.toFixed(5));
		this.connectToAirport();
	},

	_limitAirportPos: function (lat, lng) {
		if (lat > 85)
			lat = 85;
		if (lat < -85)
			lat = -85;
		if (lng > 180)
			lng = 180;
		if (lng < -180)
			lng = -180;

		return L.latLng(lat, lng);
	},

	onNameChange: function () {
		let popup = document.createElement("div");
		L.ALS.Locales.localizeElement(popup, "airportForLayer", "innerText");
		popup.innerText += " " + this.getName();
		this._airportMarker.bindPopup(popup);
	},

	connectToAirport: function () {
		const value = this.getWidgetById("connectionMethod").getValue();
		if (value === "oneFlightPerPath")
			this.connectOnePerFlightToAirport();
		else // allIntoOne
			this.connectHullToAirport();
	},

	updatePathsMeta: function () {
		this.pathsDetailsSpoiler.removeAllWidgets();
		this._pathsWidgetsNumber = 1;

		// Connect paths. Paths will be connected to the airport, their widgets will be added, and their parameters will be calculated at each of methods below.
		const value = this.getWidgetById("connectionMethod").getValue();
		if (value === "oneFlightPerPath")
			this.connectOnePerFlight();
		else // allIntoOne
			this.connectHull();
	},

	_createPathWidget: function (layer, length, toFlash, selectedArea = 0) {
		let id = L.ALS.Helpers.generateID(),
			button = new L.ALS.Widgets.Button("flashPath" + id, "flashPath", this, "flashPath"),
			lengthWidget = new L.ALS.Widgets.ValueLabel("pathLength" + id, "pathLength", "m").setFormatNumbers(true).setNumberOfDigitsAfterPoint(0),
			timeWidget = new L.ALS.Widgets.ValueLabel("flightTime" + id, "flightTime", "h:mm"),
			warning = new L.ALS.Widgets.SimpleLabel("warning" + id, "", "left", "warning");

		layer.updateWidgets = (length) => {
			lengthWidget.setValue(length);
			let time = this.getFlightTime(length);
			timeWidget.setValue(time.formatted);
			warning.setValue(time.number > 4 ? "flightTimeWarning" : "");
		}

		this.pathsDetailsSpoiler.addWidgets(
			new L.ALS.Widgets.SimpleLabel("pathLabel" + id, `${L.ALS.locale.pathTitle} ${this._pathsWidgetsNumber}`, "center", "message"),
			button
		);

		if (selectedArea) {
			this.pathsDetailsSpoiler.addWidget(
				new L.ALS.Widgets.ValueLabel("selectedArea" + id, "selectedArea", "sq.m.").setNumberOfDigitsAfterPoint(0).setFormatNumbers(true).setValue(selectedArea)
			);
		}

		this.pathsDetailsSpoiler.addWidgets(lengthWidget, timeWidget, warning);

		button.toFlash = toFlash;
		this._pathsWidgetsNumber++;
		layer.updateWidgets(length);
	},

	/**
	 * Calculates flight time for given path length
	 * @param length {number} Path length
	 * @return {{number: number, formatted: string}} Flight time in hours, both as number and formatted string
	 */
	getFlightTime: function (length) {
		let time = length / this.aircraftSpeedInMetersPerSecond / 3600,
			hours = Math.floor(time), minutes = Math.round((time % 1) * 60).toString();

		if (minutes === "60") {
			hours++;
			minutes = "00";
		}

		if (minutes.length === 1)
			minutes = "0" + minutes;

		return {number: time, formatted: hours +":" + minutes};
	},

	/**
	 * Calculates line length using haversine formula with account of flight height
	 * @param line {L.Polyline|number[][]|LatLng[]} Line
	 * @param useFlightHeight {boolean} If true, will account flight height, i.e. line will float above the Earth
	 * @return {number} Line length
	 */
	getLineLengthMeters: function (line, useFlightHeight = true) {
		let r = this.getEarthRadius(useFlightHeight), points = line instanceof Array ? line : line.getLatLngs(), distance = 0;
		if (points.length === 0)
			return 0;

		let {x, y} = MathTools.getXYPropertiesForPoint(points[0]);

		for (let i = 0; i < points.length - 1; i++) {
			let p1 = points[i], p2 = points[i + 1],
				f1 = turfHelpers.degreesToRadians(p1[y]), f2 = turfHelpers.degreesToRadians(p2[y]),
				df = f2 - f1,
				dl = turfHelpers.degreesToRadians(p2[x] - p1[x]),
				a = Math.sin(df / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
			distance += r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		}
		return distance;
	},

	/**
	 * Using given point and length calculates by how much you should modify (add or remove to) lng or lat to get a line of given length.
	 *
	 * In other words, can be used to draw straight vertical or straight horizontal lines
	 *
	 * @param startingPoint {number[]} Point in format [lng, lat]
	 * @param length {number} Line length
	 * @param isVertical {boolean} Whether line should vertical or horizontal
	 * @param useFlightHeight {boolean} If true, will account flight height
	 * @return {number} By how much you should modify (add or remove to) lng or lat to get a line of given length
	 */
	getArcAngleByLength: function (startingPoint, length, isVertical, useFlightHeight = false) {
		let r = this.getEarthRadius(useFlightHeight);

		// For vertical lines, we can simply use arc length since any two equal angles will form two equal arcs along any meridian.
		if (isVertical)
			return turfHelpers.radiansToDegrees(length / r);

		// For horizontal lines, first, we need to find a circle formed by cutting sphere by a horizontal plane
		// containing given point. To do so, we'll find a distance from a point to the line from center to
		// the North pole. This will be a radius of the said circle. Then we'll use formula above on a formed circle.

		// Angle between line from point to center and line from center to the North pole.
		let angle = turfHelpers.degreesToRadians(90 - Math.abs(startingPoint[1])),
			newR = Math.sin(angle) * r;
		return turfHelpers.radiansToDegrees(length / newR);
	},

	getEarthRadius: function (useFlightHeight = false) {
		return 6378137 + (useFlightHeight ? this.flightHeight : 0);
	},

	/**
	 * Calculates path length. By default, uses {@link L.ALS.SynthBaseLayer#getLineLengthMeters}.
	 * @param layer {L.Polyline | number[][] | LatLng[]} Path to calculate length of.
	 * @return {number} Path length
	 */
	getPathLength: function (layer) {
		return this.getLineLengthMeters(layer, true);
	},

	/**
	 * Called when there's one flight per each path. You should call {@link L.ALS.SynthBaseLayer#connectOnePerFlight} here.
	 */
	connectOnePerFlightToAirport: function () {
		let airportPos = this._airportMarker.getLatLng();

		for (let path of this.paths) {
			path.connectionsGroup.eachLayer((layer) => {
				layer.getLatLngs()[1] = airportPos;
				L.redrawLayer(layer);
				layer.updateWidgets(layer.pathLength + this.getLineLengthMeters(layer));
			});
		}

	},

	// This may be reused to connect VRP (if we'll add it), but we should replace paths with connections endpoints

	/**
	 * Builds connections per flight
	 */
	connectOnePerFlight: function () {
		for (let i = 0; i < this.paths.length; i++) {

			let path = this.paths[i], {connectionsGroup, pathGroup} = path,
				lineOptions = this.getConnectionLineOptions(this.getWidgetById(`color${i}`).getValue());

			connectionsGroup.clearLayers();

			pathGroup.eachLayer((layer) => {
				layer.pathLength = this.getPathLength(layer);

				let latLngs = layer.getLatLngs(),
					connectionLine = new L.Geodesic([latLngs[0], [0, 0], latLngs[latLngs.length - 1]], lineOptions);
				connectionLine.pathLength = layer.pathLength;
				let toFlash = [layer, connectionLine];
				if (layer.actualPaths)
					toFlash.push(...layer.actualPaths);

				this._createPathWidget(connectionLine, 1, toFlash, layer.selectedArea);
				connectionsGroup.addLayer(connectionLine);
			});
		}
		this.connectOnePerFlightToAirport(); // So we'll end up with only one place that updates widgets
	},

	/**
	 * Creates an array of cycles of paths connected to the airport
	 * @param path {Object} Path to get cycles of
	 * @return {LatLng[][]} Cycles
	 */
	onePerFlightToCycles: function (path) {
		let cycles = [], airportPos = this._airportMarker.getLatLng();

		path.pathGroup.eachLayer((layer) => {
			let latLngs = layer.getLatLngs(), toPush = [airportPos, ...latLngs, airportPos];
			toPush.pathLength = layer.pathLength + this.getLineLengthMeters([latLngs[0], airportPos]) +
				this.getLineLengthMeters([latLngs[latLngs.length - 1], airportPos]);
			cycles.push(toPush);
		})

		if (cycles.length === 0)
			return undefined;

		return cycles;
	},

	/**
	 * Returns connection line options
	 * @param color {string} Line color
	 * @return {Object} Line options
	 */
	getConnectionLineOptions: function (color) {
		return {
			color,
			dashArray: this.dashedLine,
			weight: this.lineThicknessValue,
			segmentsNumber: L.GEODESIC_SEGMENTS,
		}
	},

	flashPath: function (widget) {
		// Close menu on mobile
		if (L.ALS.Helpers.isMobile)
			this.layerSystem.clickOnMenu();

		for (let group of widget.toFlash) {
			if (!group instanceof L.FeatureGroup) {
				this.flashLine(group);
				continue;
			}
			group.eachLayer(layer => this.flashLine(layer));
		}
	},

	flashLine: async function (line) {
		if (line.isFlashing)
			return;

		let color = line.options.color;
		line.isFlashing = true;
		for (let i = 0; i < 5; i++) {
			line.setStyle({color: line.options.color === "white" ? "black" : "white"});
			await new Promise(resolve => setTimeout(resolve, 250));
		}
		line.setStyle({color});
		line.isFlashing = false;
	},

	createCapturePoint: function (coord, color) {
		return new L.CircleMarker(coord, {
			radius: this.lineThicknessValue * 2,
			stroke: false,
			fillOpacity: 1,
			fill: true,
			fillColor: color,
		});
	},

	/**
	 * Hides or shows layer.
	 * @param hide {boolean} If true, hide layer
	 * @param layer {Layer} Layer to show or hide
	 * @return {boolean} If true, layer has been hidden. False otherwise.
	 */
	hideOrShowLayer: function (hide, layer) {
		if (hide)
			layer.remove();
		else
			this.map.addLayer(layer);
		return hide;
	},

	clearSerializedPathsWidgets: function (serialized) {
		for (let i = 1; i <= this._pathsWidgetsNumber; i++)
			delete serialized._widgets["pathWidget" + i];
	}

});

require("./Hull.js");
require("./calculateParameters.js");
require("./draw.js");
require("./toGeoJSON.js");