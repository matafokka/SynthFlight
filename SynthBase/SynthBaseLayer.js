const turfHelpers = require("@turf/helpers");

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

	init: function (settings, pathGroup1, connectionsGroup1, colorLabel1, path1AdditionalLayers = [], pathGroup2 = undefined, connectionsGroup2 = undefined, colorLabel2 = undefined, path2AdditionalLayers = []) {

		this._settings = settings;

		/**
		 * Array of paths widgets to remove whenever paths are updated
		 * @type {L.ALS.Widgets.Spoiler[]}
		 */
		this._pathsWidgets = [];

		/**
		 * For numbering paths widgets
		 * @type {number}
		 * @private
		 */
		this._pathsWidgetsNumber = 1;

		this.path1 = {
			pathGroup: pathGroup1,
			connectionsGroup: connectionsGroup1,
			colorLabel: colorLabel1,
			toUpdateColors: [pathGroup1, connectionsGroup1, ...path1AdditionalLayers]
		}

		this.path2 = pathGroup2 ? {
			pathGroup: pathGroup2,
			connectionsGroup: connectionsGroup2,
			colorLabel: colorLabel2,
			toUpdateColors: [pathGroup2, connectionsGroup2, ...path2AdditionalLayers]
		} : undefined;

		this.hasYOverlay = !!this.path2;

		this.paths = [this.path1];
		if (this.hasYOverlay)
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
		this.toUpdateThickness = [...path1AdditionalLayers, ...path2AdditionalLayers];

		for (let i = 0; i < this.paths.length; i++) {
			let path = this.paths[i];
			path.hullConnection = L.polyline([[0, 0], [0, 0]], this.getConnectionLineOptions(settings[`color${i}`]));
			this.addLayers(path.pathGroup, path.connectionsGroup);
			this.toUpdateThickness.push(path.pathGroup, path.connectionsGroup);
		}

		this.serializationIgnoreList.push("_airportMarker", "toUpdateThickness");

		// Add airport
		let icon = L.divIcon({
			iconSize: null,
			className: "",
			html: "<div class='grd-lyr-airport-icon ri ri-flight-takeoff-line'></div>"
		})

		this._airportMarker = L.marker(this.map.getCenter(), {
			icon: icon,
			draggable: true
		});

		// Set inputs' values to new ones on drag
		this.addEventListenerTo(this._airportMarker, "drag", "onMarkerDrag");
		this.addLayers(this._airportMarker);
	},

	addBaseParametersInputSection: function () {
		this.addWidget(
			new L.ALS.Widgets.Number("lineThickness", "lineThickness", this, "setLineThickness").setMin(1).setMax(20).setValue(this._settings.lineThicknessValue),
		);

		for (let i = 0; i < this.paths.length; i++) {
			this.addWidget(
				new L.ALS.Widgets.Color(`color${i}`, this.paths[i].colorLabel, this, "_setPathsColor").setValue(this._settings[`color${i}`]),
			);
		}

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

	addBaseParametersOutputSection: function () {
		let yWidgets = [];
		if (this.hasYOverlay) {
			yWidgets = [
				new L.ALS.Widgets.ValueLabel("ly", "ly", "m"),
				new L.ALS.Widgets.ValueLabel("Ly", "Ly", "m"),
				new L.ALS.Widgets.ValueLabel("By", "By", "m"),
			];
		}

		let valueLabels = [
			new L.ALS.Widgets.ValueLabel("flightHeight", "flightHeight"),
			new L.ALS.Widgets.ValueLabel("lx", "lx", "m"),
			new L.ALS.Widgets.ValueLabel("Lx", "Lx", "m"),
			new L.ALS.Widgets.ValueLabel("Bx", "Bx", "m"),
			...yWidgets,
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
	},

	_setPathsColor: function () {
		for (let i = 0; i < this.paths.length; i++) {
			let style = {color: this.getWidgetById(`color${i}`).getValue()},
				path = this.paths[i];
			for (let group of path.toUpdateColors)
				group.setStyle(style);
		}
	},

	setAirportLatLng: function () {
		this._airportMarker.setLatLng([
			this.getWidgetById("airportLat").getValue(),
			this.getWidgetById("airportLng").getValue()
		]);
		this.connectToAirport();
	},

	onMarkerDrag: function () {
		let latLng = this._airportMarker.getLatLng();
		this.getWidgetById("airportLat").setValue(latLng.lat.toFixed(5));
		this.getWidgetById("airportLng").setValue(latLng.lng.toFixed(5));
		this.connectToAirport();
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
		// Clear widgets
		for (let widget of this._pathsWidgets)
			this.removeWidget(widget.id);

		this._pathsWidgets = [];
		this._pathsWidgetsNumber = 1;

		// Connect paths. Paths will be connected to the airport, their widgets will be added, and their parameters will be calculated at each of methods below.
		const value = this.getWidgetById("connectionMethod").getValue();
		if (value === "oneFlightPerPath")
			this.connectOnePerFlight();
		else// allIntoOne
			this.connectHull();
	},

	_createPathWidget: function (length, toFlash) {
		let button = new L.ALS.Widgets.Button("flashPath", "flashPath", this, "flashPath");
		button.toFlash = toFlash;

		let widget = new L.ALS.Widgets.Spoiler(`pathWidget${this._pathsWidgetsNumber}`, `${L.ALS.locale.pathSpoiler} ${this._pathsWidgetsNumber}`)
			.addWidgets(
				button,
				new L.ALS.Widgets.ValueLabel("pathLength", "pathLength", "m").setFormatNumbers(true).setNumberOfDigitsAfterPoint(0).setValue(length),
				new L.ALS.Widgets.ValueLabel("flightTime", "flightTime", "h:mm").setValue(this.getFlightTime(length)),
			);

		this.addWidgets(widget);
		this._pathsWidgetsNumber++;
		this._pathsWidgets.push(widget);
		return widget;
	},

	/**
	 * Calculates flight time for given path length
	 * @param length {number} Path length
	 * @param formatAsTimeSpan {boolean} If true, will format time as time span
	 * @return {string|number} Flight time in hours
	 */
	getFlightTime: function (length, formatAsTimeSpan = true) {
		let time = length / this.aircraftSpeedInMetersPerSecond / 3600;

		if (!formatAsTimeSpan)
			return time;

		let hours = Math.floor(time), minutes = Math.round((time % 1) * 60).toString();

		if (minutes === "60") {
			hours++;
			minutes = "00";
		}

		if (minutes.length === 1)
			minutes = "0" + minutes;

		return hours + ":" + minutes;
	},

	/**
	 * Calculates line length using haversine formula with account of flight height
	 * @param line {L.Polyline|number[][]|LatLng[]} Line
	 * @param useFlightHeight {boolean} If true, will account flight height, i.e. line will float above the Earth
	 * @return {number} Line length
	 */
	getLineLengthMeters: function (line, useFlightHeight = true) {
		let r = 6371000 + (useFlightHeight ? this.flightHeight : 0), points = line instanceof Array ? line : line.getLatLngs(), distance = 0, x, y;
		if (points.length === 0)
			return 0;

		if (points[0].lat === undefined) {
			x = "0";
			y = "1";
		} else {
			x = "lng";
			y = "lat";
		}

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
	 * Called when there's one flight per each path. You should call {@link L.ALS.SynthBaseLayer#connectOnePerFlight} here.
	 */
	connectOnePerFlightToAirport: function () {
		let airportPos = this._airportMarker.getLatLng();

		for (let path of this.paths) {
			let layers = path.connectionsGroup.getLayers();
			for (let layer of layers) {
				layer.getLatLngs()[1] = airportPos;
				layer.redraw();

				let length = layer.pathLength + this.getLineLengthMeters(layer);
				layer.pathWidget.getWidgetById("pathLength").setValue(length);
				layer.pathWidget.getWidgetById("flightTime").setValue(this.getFlightTime(length));
			}
		}

	},

	// This may be reused to connect VRP (if we'll add it), but we should replace paths with connections endpoints

	/**
	 * Builds connections per flight
	 */
	connectOnePerFlight: function () {
		for (let i = 0; i < this.paths.length; i++) {

			let path = this.paths[i], {connectionsGroup, pathGroup} = path, layers = pathGroup.getLayers(),
				lineOptions = this.getConnectionLineOptions(this.getWidgetById(`color${i}`).getValue());

			connectionsGroup.clearLayers();

			for (let layer of layers) {
				layer.pathLength = this.getLineLengthMeters(layer);

				let latLngs = layer.getLatLngs(),
					connectionLine = L.polyline([latLngs[0], [0, 0], latLngs[latLngs.length - 1]], lineOptions);
				connectionLine.pathLength = layer.pathLength;
				let toFlash = [layer, connectionLine];
				if (layer.actualPaths)
					toFlash.push(...layer.actualPaths)

				connectionLine.pathWidget = this._createPathWidget(1, toFlash);
				connectionsGroup.addLayer(connectionLine);
			}
		}
		this.connectOnePerFlightToAirport(); // So we'll end up with only one place that updates widgets
	},

	/**
	 * Creates an array of cycles of paths connected to the airport
	 * @param path {Object} Path to get cycles of
	 * @return {LatLng[][]} Cycles
	 */
	onePerFlightToCycles: function (path) {
		let layers = path.pathGroup.getLayers(), cycles = [], airportPos = this._airportMarker.getLatLng();
		for (let layer of layers)
			cycles.push([airportPos, ...layer.getLatLngs()], airportPos);
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
			weight: this.lineThicknessValue
		}
	},

	flashPath: function (widget) {
		for (let group of widget.toFlash) {
			let layers = group instanceof L.FeatureGroup ? group.getLayers() : [group];
			for (let layer of layers)
				this.flashLine(layer);
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

});

require("./Hull.js");
require("./calculateParameters.js");
require("./toGeoJSON.js");