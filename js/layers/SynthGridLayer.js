const union = require("@turf/union").default;
const bbox = require("@turf/bbox").default;
const turfHelpers = require("@turf/helpers");
const MathTools = require("../MathTools.js");
const RomanNumerals = require("roman-numerals");
const geojsonMerge = require("@mapbox/geojson-merge"); // Using this since turfHelpers.featureCollection() discards previously defined properties.
require("./SynthGridWizard.js");

/**
 * Grid layer
 */
L.ALS.SynthGridLayer = L.ALS.Layer.extend({

	defaultName: "Grid Layer",

	gridBorderColor: "#6495ed",

	gridFillColor: "#6495ed",

	meridiansColor: "#ad0000",

	parallelsColor: "#007800",

	lineThickness: 2,

	_alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",

	_currentStandardScale: -1,

	/**
	 * Indicates whether the grid is displayed or not.
	 * @type {boolean}
	 */
	isDisplayed: true,

	_doHidePolygonWidgets: false,
	_doHidePathsConnections: false,
	_doHidePathsByMeridians: false,
	_doHidePathsByParallels: false,
	_doHidePathsNumbers: false,

	init: function (wizardResults) {
		this.selectedPolygons = {};
		this.selectedPolygonsWidgets = {};

		// Create menu

		let camOpts = {
			"min": 1,
			"step": 1,
			"value": 17000
		};

		let calculateParametersError = new L.ALS.Widgets.SimpleLabel("calculateParametersError");
		calculateParametersError.setStyle("error");
		let cameraParametersWarning = new L.ALS.Widgets.SimpleLabel("cameraParametersWarning");
		cameraParametersWarning.setStyle("warning");

		let menu = [
			new L.ALS.Widgets.Checkbox("hidePolygonWidgets", "Hide widgets on the map", this, "_hidePolygonWidgets"),
			new L.ALS.Widgets.Checkbox("hideNumbers", "Hide points' numbers on the map", this, "_hidePointsNumbers"),
			new L.ALS.Widgets.Checkbox("hidePathsConnections", "Hide paths' connections", this, "_hidePathsConnections"),
			new L.ALS.Widgets.Checkbox("hidePathsByMeridians", "Hide paths by meridians", this, "_hidePathsByMeridians"),
			new L.ALS.Widgets.Checkbox("hidePathsByParallels", "Hide paths by parallels", this, "_hidePathsByParallels"),
			new L.ALS.Widgets.Number("lineThickness", "Line thickness", this, "_setLineThickness", {
				"min": 1,
				"max": 20,
				"value": this.lineThickness
			}),
			new L.ALS.Widgets.Color("gridBorderColor", "Border color", this, "_setColor", { "value": this.gridBorderColor }),
			new L.ALS.Widgets.Color("gridFillColor", "Fill color", this, "_setColor", { "value": this.gridFillColor }),
			new L.ALS.Widgets.Color("meridiansColor", "Paths by meridians color", this, "_setColor", { "value": this.meridiansColor }),
			new L.ALS.Widgets.Color("parallelsColor", "Paths by parallels color", this, "_setColor", { "value": this.parallelsColor }),

			new L.ALS.Widgets.Divider("div1"),

			new L.ALS.Widgets.Number("airportLat", "Airport latitude", this, "_setAirportLatLng", {
				"min": -90,
				"max": 90,
				"step": 0.01
			}),
			new L.ALS.Widgets.Number("airportLng", "Airport longitude", this, "_setAirportLatLng", {
				"min": -180,
				"max": 180,
				"step": 0.01
			}),
			new L.ALS.Widgets.Number("aircraftSpeed", "Aircraft speed (km/h)", this, "calculateParameters", {
				"min": 0,
				"step": 1,
				"value": 350
			}),
			new L.ALS.Widgets.Number("imageScale", "Image scale denominator", this, "calculateParameters", {
				"min": 1,
				"step": 1,
				"value": 25000
			}),
			new L.ALS.Widgets.Number("cameraWidth", "Camera width (px)", this, "calculateParameters", camOpts),
			new L.ALS.Widgets.Number("cameraHeight", "Camera height (px)", this, "calculateParameters", camOpts),
			new L.ALS.Widgets.Number("pixelWidth", "Pixel size (μm)", this, "calculateParameters", {
				"min": 0.001,
				"step": 0.001,
				"value": 5
			}),
			new L.ALS.Widgets.Number("overlayBetweenPaths", "Overlay between images from adjacent paths (%)", this, "calculateParameters", {
				"min": 60,
				"max": 100,
				"step": 0.1,
				"value": 60
			}),
			new L.ALS.Widgets.Number("overlayBetweenImages", "Overlay between images from the same path (%)", this, "calculateParameters", {
				"min": 30,
				"max": 100,
				"step": 0.1,
				"value": 30
			}),
			new L.ALS.Widgets.Number("focalLength", "Focal length (mm)", this, "calculateParameters", {
				"min": 0.001,
				"step": 1,
				"value": 112
			}),
			calculateParametersError,
			cameraParametersWarning,
			new L.ALS.Widgets.Divider("div2"),
		];

		let valueLabels = [
			new L.ALS.Widgets.ValueLabel("lngPathsCount", "Paths count in one cell by parallels"),
			new L.ALS.Widgets.ValueLabel("latPathsCount", "Paths count in one cell by meridians"),
			new L.ALS.Widgets.ValueLabel("lngPathsLength", "Length of paths by parallels", "m"),
			new L.ALS.Widgets.ValueLabel("latPathsLength", "Length of paths by meridians", "m"),
			new L.ALS.Widgets.ValueLabel("lngFlightTime", "Flight time by parallels", "h"),
			new L.ALS.Widgets.ValueLabel("latFlightTime", "Flight time by meridians", "h"),
			new L.ALS.Widgets.ValueLabel("lngCellSizeInMeters", "Mean cell width", "m"),
			new L.ALS.Widgets.ValueLabel("latCellSizeInMeters", "Mean cell height", "m"),
			new L.ALS.Widgets.ValueLabel("selectedArea", "Selected area", "sq.m."),
			new L.ALS.Widgets.ValueLabel("flightHeight", "Flight height (m)"),
			new L.ALS.Widgets.ValueLabel("lx", "Image height, lx", "m"),
			new L.ALS.Widgets.ValueLabel("Lx", "Image height on the ground, Lx", "m"),
			new L.ALS.Widgets.ValueLabel("Bx", "Distance between photographing positions, Bx", "m"),
			new L.ALS.Widgets.ValueLabel("ly", "Image width, ly", "m"),
			new L.ALS.Widgets.ValueLabel("Ly", "Image width on the ground, Ly", "m"),
			new L.ALS.Widgets.ValueLabel("By", "Distance between adjacent paths, By", "m"),
			new L.ALS.Widgets.ValueLabel("GSI", "GSI", "m"),
			new L.ALS.Widgets.ValueLabel("IFOV", "IFOV", "μrad"),
			new L.ALS.Widgets.ValueLabel("GIFOV", "GIFOV", "m"),
			new L.ALS.Widgets.ValueLabel("FOV", "FOV", "deg"),
			new L.ALS.Widgets.ValueLabel("GFOV", "GFOV", "m"),
		];

		for (let widget of menu)
			this.addWidget(widget);

		for (let widget of valueLabels) {
			widget.setFormatNumbers(true);
			this.addWidget(widget);
		}

		this.lngDistance = parseFloat(wizardResults["gridLngDistance"]);
		this.latDistance = parseFloat(wizardResults["gridLatDistance"]);

		// Determine whether this grid uses standard scale or not
		let scale = wizardResults["gridStandardScales"];
		if (scale !== "Custom") {
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
		this.hidingThreshold = this._currentStandardScale === Infinity ? 15 : 70; // If grid will have labels, on lower zoom levels map will become both messy and unusably slow. So we have to set higher hiding threshold.

		// To optimize the grid and reduce visual clutter, let's:
		// 1. Display only visible polygons. If we'll render the whole thing, user will need from couple of MBs to TBs of RAM.
		// 2. Hide grid when it'll contain a lot of polygons and becomes messy
		// Additional redrawing actually won't introduce any noticeable delay.

		// Create empty group containing our stuff
		let props = ["polygonGroup", "widgetsGroup", "bordersGroup", "pathsWithoutConnectionsGroup"];
		for (let prop of props) {
			this[prop] = L.featureGroup();
			this.addLayers(this[prop]);
		}
		this.labelsGroup = new L.LabelLayer(false);
		this.addLayers(this.labelsGroup);

		/**
		 * Contains polygons' names IDs
		 * @type {string[]}
		 * @private
		 */
		this._namesIDs = [];

		// Bind all the methods
		this.addEventListenerTo(this.map, "moveend resize", "_onMapPan");
		this.addEventListenerTo(this.map, "zoomend", "_onMapZoom");

		// Add airport
		let icon = L.divIcon({
			iconSize: null,
			className: "",
			html: "<div class='grd-lyr-airport-icon fas fa-plane'></div>"
		})

		this._airportMarker = L.marker(this.map.getCenter(), {
			icon: icon,
			draggable: true
		});

		// Set inputs' values to new ones on drag
		this.addEventListenerTo(this._airportMarker, "drag", "onMarkerDrag");
		this._airportMarker.fire("drag"); // Just to set values
		this.addLayers(this._airportMarker);

		this.onNameChange();
		this._updateGrid();
	},

	onMarkerDrag: function() {
		let latLng = this._airportMarker.getLatLng();
		this.getControlById("airportLat").setValue(latLng.lat.toFixed(5));
		this.getControlById("airportLng").setValue(latLng.lng.toFixed(5));
		this._drawPaths();
	},

	onNameChange: function() {
		this._airportMarker.bindPopup("Airport for layer " + this.name);
	},

	/**
	 * When map is being panned, removes previously drawn polygons and draws only visible ones.
	 * This improves performance and memory consumption.
	 * @private
	 */
	_onMapPan: function () {

		// Though it seems like leaflet doesn't perform any actions, we'll still won't do anything in case this behavior will change
		if (!this.isShown || !this.isDisplayed)
			return;

		this.polygonGroup.clearLayers();

		for (let id of this._namesIDs)
			this.labelsGroup.deleteLabel(id);
		this._namesIDs = [];

		// Get viewport bounds
		let bounds = this.map.getBounds();
		let topLeft = bounds.getNorthWest(),
			topRight = bounds.getNorthEast(),
			bottomLeft = bounds.getSouthWest(),
			bottomRight = bounds.getSouthEast();

		// Determine the longest sides of the window
		let latFrom, latTo, lngFrom, lngTo;

		if (topLeft.lat > topRight.lat) {
			latFrom = bottomLeft.lat;
			latTo = topLeft.lat;
		} else {
			latFrom = bottomRight.lat;
			latTo = topRight.lat;
		}

		if (topRight.lng > bottomRight.lng) {
			lngFrom = topLeft.lng;
			lngTo = topRight.lng;
		} else {
			lngFrom = bottomLeft.lng;
			lngTo = bottomRight.lng;
		}

		// Calculate correct start and end points for given distances
		latFrom = this._closestLess(latFrom, this.latDistance);
		latTo = this._closestGreater(latTo, this.latDistance);
		lngFrom = this._closestLess(lngFrom, this.lngDistance)
		lngTo = this._closestGreater(lngTo, this.lngDistance);

		let mapLatLng = this.map.getBounds().getNorthWest();
		let isFirstIteration = true;

		let createLabel = (latLng, content, origin="center", colorful = false) => {
			let id = L.ALS.Helpers.generateID();
			this._namesIDs.push(id);
			this.labelsGroup.addLabel(id, latLng, content, { origin: origin });
			if (colorful)
				this.labelsGroup.setLabelDisplayOptions(id, L.LabelLayer.DefaultDisplayOptions.Success);
		}

		// We will use toFixed() to generate lat and lng labels and to fix floating point errors in generating polygons' names

		for (let lat = latFrom; lat <= latTo; lat += this.latDistance) { // From bottom (South) to top (North)
			createLabel([lat, mapLatLng.lng], this.toFixed(lat), "leftCenter", true);
			for (let lng = lngFrom; lng <= lngTo; lng += this.lngDistance) { // From left (West) to right (East)
				if (isFirstIteration)
					createLabel([mapLatLng.lat, lng], this.toFixed(lng), "topCenter", true);

				let polygon = L.polygon([
					[lat, lng],
					[lat + this.latDistance, lng],
					[lat + this.latDistance, lng + this.lngDistance],
					[lat, lng + this.lngDistance],
				]);

				// If this polygon has been selected, we should fill it and replace it in the array.
				// Because fill will be changed, we can't keep old polygon, it's easier to just replace it
				let name = this._generatePolygonName(polygon)
				let poly = this.selectedPolygons[name];
				let isSelected = poly !== undefined;
				polygon.setStyle({
					color: this.gridBorderColor,
					fillColor: this.gridFillColor,
					fill: isSelected,
					weight: this.lineThickness
				});

				// We should select or deselect polygons upon double click
				this.addEventListenerTo(polygon, "dblclick contextmenu", "_selectOrDeselectPolygon");
				this.polygonGroup.addLayer(polygon);

				if (isSelected)
					this.selectedPolygons[name] = polygon;

				// Generate current polygon's name if grid uses one of standard scales
				if (this._currentStandardScale === Infinity) {
					polygon.polygonName = "Not in standard scale system";
					continue;
				}

				// Firstly, we round our coordinates to avoid floating-point errors.
				// Secondly, our point lies on bottom left corner. To avoid dealing with points on lines and errors related to it, we need to add some value to each coordinate.
				let fixedLat = this.toFixed(lat + this.latDistance / 2);
				let fixedLng = this.toFixed(lng + this.lngDistance / 2);

				// 1:1 000 000. This part is always present
				let index = Math.floor(Math.abs(fixedLat) / 4);
				let letter = this._alphabet[index];
				let number = Math.floor(fixedLng / 6) + 31;
				let polygonName = letter + "-" + number;

				/**
				 * Splits a sheet of given size to given number of columns and rows.
				 * Counts parts from left to right and from top to bottom.
				 * Returns number of part containing current point with coordinates (fixedLat, fixedLng).
				 * @param colsAndRowsCount Number of both columns and rows. I.e., if you'll pass 3, it will divide sheet to 9 equal parts.
				 * @param sheetLat Size of sheet by latitude
				 * @param sheetLng Size of sheet by longitude
				 * @return {number} Number of part containing current point with coordinates (fixedLat, fixedLng)
				 */
				let sheetNumber = (colsAndRowsCount, sheetLat = 4, sheetLng = 6) => {
					let fixedLatScale = this.toFixed(sheetLat); // Truncate sheet sizes to avoid floating point errors.
					let fixedLngScale = this.toFixed(sheetLng);

					// Ok, imagine a ruler. It looks like |...|...|...|. In our case, | is sheet's border. Our point lies between these borders.
					// We need to find how much borders we need to reach our point. We do that for both lat and lng.
					// Here we're finding coordinates of these borders
					let bottomLat = this.toFixed(this._closestLess(fixedLat, fixedLatScale));
					let leftLng = this.toFixed(this._closestLess(fixedLng, fixedLngScale));

					// Look at the division. Numerator is the position of our point relative to the border. Denominator represents how much degrees are in one part of the divided sheet.
					// By dividing position by number of parts, we get the number of part containing our point.
					let row = colsAndRowsCount + Math.floor((bottomLat - fixedLat) / (fixedLatScale / colsAndRowsCount)) + 1;
					let col = -Math.floor((leftLng - fixedLng) / (fixedLngScale / colsAndRowsCount));

					return colsAndRowsCount * (row - 1) + col;
					//return " | Row: " + row + " Col: " + col;

				}

				if (this._currentStandardScale === 500000) // 1:500 000
					polygonName += "-" + sheetNumber(2);
				else if (this._currentStandardScale === 300000) // 1:300 000
					polygonName = RomanNumerals.toRoman(sheetNumber(3)) + "-" + polygonName;
				else if (this._currentStandardScale === 200000)  // 1:200 000
					polygonName += "-" + RomanNumerals.toRoman(sheetNumber(6));
				else if (this._currentStandardScale <= 100000) // 1:100 000. This part is always present if scale is less than or equal to 1:100 000.
					polygonName += "-" + sheetNumber(12);

				if (this._currentStandardScale <= 50000 && this._currentStandardScale > 5000) {
					polygonName += "-" + this._alphabet[sheetNumber(2, 2 / 6, 3 / 6) - 1]; // 1:50 000. Always present.
					if (this._currentStandardScale <= 25000)
						polygonName += "-" + this._alphabet[sheetNumber(2, 1 / 6, 15 / 60) - 1].toLowerCase();
					if (this._currentStandardScale <= 10000)
						polygonName += "-" + sheetNumber(2, 5 / 60, 7.5 / 60);
				} else if (this._currentStandardScale <= 5000) {
					polygonName += "("
					if (this._currentStandardScale <= 5000)
						polygonName += sheetNumber(16, 2 / 6, 3 / 6);
					if (this._currentStandardScale === 2000) {
						let index = sheetNumber(3, (1 + 15 / 60) / 60, (1 + 52.5 / 60) / 60) - 1;
						if (index >= 6)
							index -= 6;
						else
							index += 3;
						polygonName += "-" + this._alphabet[index].toLowerCase();
					}
					polygonName += ")";
				}

				if (lat < 0)
					polygonName += " (S)";
				polygon.polygonName = polygonName;
				createLabel([lat + this.latDistance / 2, lng + this.lngDistance / 2], polygonName);
			}
			isFirstIteration = false;
		}
		this.labelsGroup.redraw();
	},

	_closestGreater: function (current, divider) {
		return Math.ceil(current / divider) * divider;
	},

	_closestLess: function (current, divider) {
		return Math.floor(current / divider) * divider;
	},

	/**
	 * Hides grid when zoom is too low. Also optimizes performance.
	 * @private
	 */
	_onMapZoom: function () {
		if (!this.isShown)
			return;

		// Let's calculate how much pixels will be in given distance
		// We'll account only latitude for simplicity.
		let topLeft = this.map.getBounds().getNorthWest();
		let distanceLatLng = L.latLng(topLeft.lat, topLeft.lng + this.lngDistance);
		let distancePx = this.map.latLngToContainerPoint(distanceLatLng).x;

		// Grid becomes messy when distance is around 15 pixels
		let shouldHide = distancePx < this.hidingThreshold;
		if (shouldHide) {
			this.polygonGroup.remove();
			this.bordersGroup.remove();
			this.labelsGroup.remove();
			this.widgetsGroup.remove();
			this.isDisplayed = false;
		}
		else if (!shouldHide && !this.isDisplayed) {
			this.isDisplayed = true;
			this.polygonGroup.addTo(this.map); // Add removed polygons
			this.bordersGroup.addTo(this.map);
			this.labelsGroup.addTo(this.map);
		}

		shouldHide = distancePx < 200;
		if (this.isDisplayed && !this._doHidePolygonWidgets) {
			if (shouldHide)
				this.widgetsGroup.remove();
			else
				this.widgetsGroup.addTo(this.map);
		}
		this._onMapPan(); // Redraw polygons
	},

	onShow: function () {
		L.ALS.Layer.prototype.onShow.call(this);
		this._updateGrid(); // Update grid upon showing
	},

	/**
	 * Selects or deselects polygon upon double click and redraws flight paths
	 * @param event
	 */
	_selectOrDeselectPolygon: function(event) {
		let polygon = event.target;

		let name = this._generatePolygonName(polygon); // Generate name for current polygon
		// If this polygon is already selected, remove selection from it and don't do anything
		if (this.selectedPolygons[name] !== undefined) {
			polygon.setStyle({fill: false});
			delete this.selectedPolygons[name];
			let widgetLayer = this.selectedPolygonsWidgets[name];
			this.widgetsGroup.removeLayer(widgetLayer);
			delete this.selectedPolygonsWidgets[name];
		} else {
			polygon.setStyle({fill: true});
			this.selectedPolygons[name] = polygon;

			let controlsContainer = new L.WidgetLayer(polygon.getLatLngs()[0][1], "topLeft");
			let numberAttrs = {
				min: 1,
				value: 1
			};

			let errorLabel = new L.ALS.Widgets.SimpleLabel("error");
			errorLabel.setStyle("error");
			let widgets = [
				new L.ALS.Widgets.Number("minHeight", "Min height (m)", this, "_calculatePolygonParameters", numberAttrs),
				new L.ALS.Widgets.Number("maxHeight", "Max height (m)", this, "_calculatePolygonParameters", numberAttrs),
				new L.ALS.Widgets.ValueLabel("meanHeight", "Mean height", "m"),
				new L.ALS.Widgets.ValueLabel("absoluteHeight", "Absolute height", "m"),
				new L.ALS.Widgets.ValueLabel("elevationDifference", "(Max height - Min height) / Flight height"),
				new L.ALS.Widgets.ValueLabel("reliefType", "Relief type"),
				errorLabel
			];
			for (let widget of widgets)
				controlsContainer.addWidget(widget);

			let toFormatNumbers = ["meanHeight", "absoluteHeight", "elevationDifference"];
			for (let id of toFormatNumbers)
				controlsContainer.getControlById(id).setFormatNumbers(true);

			this.selectedPolygonsWidgets[name] = controlsContainer;
			this.widgetsGroup.addLayer(controlsContainer);
		}
		this._updateGrid();
	},

	_setColor: function (widget) {
		this[widget.getId()] = widget.getValue();
		this._updateGrid();
	},

	_setLineThickness: function (widget) {
		this.lineThickness = widget.getValue();
		this._updateGrid();
	},

	_hidePathsConnections: function (widget) {
		this._doHidePathsConnections = widget.getValue();
		this._drawPaths();
	},

	/**
	 * Updates grid.
	 * @private
	 */
	_updateGrid: function () {
		this.labelsGroup.deleteAllLabels();
		this._onMapZoom();
		this.calculateParameters();
		this._calculatePolygonParameters();
		this._drawPaths();
	},

	_hidePolygonWidgets: function (widget) {
		this._doHidePolygonWidgets = this._hideOrShowLayer(widget, this.widgetsGroup);
	},

	_hidePointsNumbers: function (widget) {
		this._doHidePathsNumbers = widget.getValue();
		this._updateGrid();
	},

	_hidePathsByMeridians: function (widget) {
		this._doHidePathsByMeridians = this._hideOrShowLayer(widget, this.pathsByMeridians);
		this._updateGrid();
	},

	_hidePathsByParallels: function (widget) {
		this._doHidePathsByParallels = this._hideOrShowLayer(widget, this.pathsByParallels);
		this._updateGrid();
	},

	/**
	 * Hides or shows layer.
	 * @param checkbox {L.ALS.Widgets.Checkbox} Checkbox that indicates whether layer should be hidden or not
	 * @param layer {L.ALS.Layer} Layer to show or hide
	 * @return {boolean} If true, layer has been hidden. False otherwise.
	 * @private
	 */
	_hideOrShowLayer: function (checkbox, layer) {
		let isChecked = checkbox.getValue();
		if (isChecked)
			layer.remove();
		else
			this.map.addLayer(layer);
		return isChecked;
	},

	/**
	 * Generates polygon name for adding into this.selectedPolygons
	 * @param polygon Polygon to generate name for
	 * @return {string} Name for given polygon
	 * @private
	 */
	_generatePolygonName: function (polygon) {
		let firstPoint = polygon.getLatLngs()[0][0];
		return "p_" + this.toFixed(firstPoint.lat) + "_" + this.toFixed(firstPoint.lng);
	},

	statics: {
		wizard: new L.ALS.SynthGridWizard()
	},

	_setAirportLatLng: function() {
		this._airportMarker.setLatLng([
			this.getControlById("airportLat").getValue(),
			this.getControlById("airportLng").getValue()
		]);
		this._drawPaths();
	},

	_calculatePolygonParameters: function () {
		let areaIncrement = Math.round(this["latCellSizeInMeters"] * this["lngCellSizeInMeters"]);
		this.selectedArea = 0;
		let unitedPolygons = undefined;
		for (let name in this.selectedPolygons) {
			if (!this.selectedPolygons.hasOwnProperty(name))
				continue;
			unitedPolygons = this._addSelectedPolygonToGeoJSON(unitedPolygons, name);
			this.selectedArea += areaIncrement;

			let layer = this.selectedPolygons[name];
			let widgetContainer = this.selectedPolygonsWidgets[name];

			layer.minHeight = widgetContainer.getControlById("minHeight").getValue();
			layer.maxHeight = widgetContainer.getControlById("maxHeight").getValue();

			let errorLabel = widgetContainer.getControlById("error");
			if (layer.minHeight > layer.maxHeight) {
				errorLabel.setValue("Min height should be less than or equal to max height!");
				continue;
			}
			errorLabel.setValue("");

			layer.meanHeight = Math.round((layer.maxHeight + layer.minHeight) / 2);
			layer.absoluteHeight = this["flightHeight"] + layer.meanHeight;

			layer.elevationDifference = (layer.maxHeight - layer.minHeight) / this["flightHeight"];
			layer.reliefType = (layer.elevationDifference >= 0.2) ? "Variable" : "Plain";

			let names = ["meanHeight", "absoluteHeight", "elevationDifference", "reliefType"];
			for (let name of names) {
				let value;
				try { value = this.toFixed(layer[name]); }
				catch (e) { value = layer[name]; }
				widgetContainer.getControlById(name).setValue(value);
			}
		}
		this.getControlById("selectedArea").setValue(this.selectedArea);

		// Draw thick borders around selected polygons
		this.bordersGroup.clearLayers();
		if (unitedPolygons === undefined)
			return;
		let geometry = unitedPolygons.geometry;
		let isMultiPolygon = (geometry.type === "MultiPolygon");
		for (let polygon of geometry.coordinates) {
			let line = L.polyline([], {
				color: this.gridBorderColor,
				weight: this.lineThickness * 2
			});
			let coordinates = isMultiPolygon ? polygon[0] : polygon;
			for (let coordinate of coordinates)
				line.addLatLng([coordinate[1], coordinate[0]]);
			this.bordersGroup.addLayer(line);
		}
	},

	calculateParameters: function () {// Get values from inputs
		let parameters = ["cameraWidth", "cameraHeight", "pixelWidth", "focalLength", "imageScale", "overlayBetweenPaths", "overlayBetweenImages", "aircraftSpeed"];
		for (let param of parameters)
			this[param] = this.getControlById(param).getValue();
		this.flightHeight = this.imageScale * this.focalLength;

		let cameraParametersWarning = this.getControlById("cameraParametersWarning");
		if (this["cameraHeight"] > this["cameraWidth"])
			cameraParametersWarning.setValue("Camera height is greater than camera width!");
		else
			cameraParametersWarning.setValue("");

		let pixelWidth = this["pixelWidth"] * 1e-6;
		let focalLength = this["focalLength"] * 0.001;

		this.ly = this["cameraWidth"] * pixelWidth; // Image size in meters
		this.Ly = this.ly * this.imageScale // Image width on the ground
		this.By = this.Ly * (100 - this["overlayBetweenPaths"]) / 100; // Distance between paths

		let latLngs = ["lat", "lng"];

		for (let name of latLngs) {
			let sizeName = name + "CellSizeInMeters", countName = name + "PathsCount";

			let cellSize = Math.round(turfHelpers.radiansToLength(turfHelpers.degreesToRadians(this[name + "Distance"]), "meters"));
			let pathsCount = Math.ceil(cellSize / this.By);
			this[sizeName] = cellSize;
			this[countName] = pathsCount;

			this.getControlById(sizeName).setValue(this.toFixed(cellSize));
			this.getControlById(countName).setValue(pathsCount);
		}

		this.lx = this["cameraHeight"] * pixelWidth; // Image height
		this.Lx = this.lx * this.imageScale; // Image height on the ground
		this.Bx = this.Lx * (100 - this["overlayBetweenImages"]) / 100; // Capture basis, distance between images' centers
		this.doubleBasis = turfHelpers.lengthToDegrees(this.Bx, "meters") * 2;

		this.GSI = pixelWidth * this.imageScale;
		this.IFOV = pixelWidth / focalLength * 1e6;
		this.GIFOV = this.GSI;
		this.FOV = this["cameraWidth"] * this.IFOV;
		this.GFOV = this["cameraWidth"] * this.GSI;

		this.aircraftSpeedInMetersPerSecond = this["aircraftSpeed"] * 1 / 36;

		let names = ["flightHeight", "lx", "Lx", "Bx", "ly", "Ly", "By", "GSI", "IFOV", "GIFOV", "FOV", "GFOV",];
		for (let name of names){
			let value;
			try { value = this.toFixed(this[name]); }
			catch (e) { value = this[name]; }
			this.getControlById(name).setValue(value);
		}

		this._drawPaths(); // Redraw paths
		this._calculatePolygonParameters();
	},

	_drawPaths: function () {
		// Remove previously added paths
		let params = [
			["pathsByParallels", "parallels", this.parallelsColor],
			["pathsByMeridians", "meridians", this.meridiansColor]
		];

		for (let param of params) {
			let pathName = param[0];
			if (this[pathName] !== undefined)
				this.removeLayers(this[pathName]);
			this[pathName] = L.polyline([], {
				color: param[2],
				weight: this.lineThickness
			});
		}

		this.pathsWithoutConnectionsGroup.clearLayers();

		// Validate parameters

		let errorLabel = this.getControlById("calculateParametersError");
		let parallelsPathsCount = this["lngPathsCount"];
		let meridiansPathsCount = this["latPathsCount"];

		if (parallelsPathsCount === undefined) {
			errorLabel.setValue("Distance between paths hasn't been calculated!");
			return;
		}

		if (parallelsPathsCount >= 20 || meridiansPathsCount >= 20) {
			errorLabel.setValue("Calculated paths count is too big, it should be less than 20. Please, check your values.");
			return;
		}

		if (parallelsPathsCount <= 2 || meridiansPathsCount <= 2) {
			errorLabel.setValue("Calculated paths count is too small, it should be greater than 2. Please, check your values.");
			return;
		}
		errorLabel.setValue("");

		this._drawPathsWorker(true)
		this._drawPathsWorker(false);
	},

	/**
	 * Draws flight paths. Use _drawPaths wrapper to draw paths instead of this.
	 * @private
	 */
	_drawPathsWorker: function (isParallels) {
		let pathName, nameForOutput, color, hideEverything;
		if (isParallels) {
			pathName = "pathsByParallels";
			nameForOutput = "lng";
			color = "parallelsColor";
			hideEverything = this._doHidePathsByParallels;
		} else {
			pathName = "pathsByMeridians";
			nameForOutput = "lat";
			color = "meridiansColor";
			hideEverything = this._doHidePathsByMeridians;
		}

		let parallelsPathsCount = this["lngPathsCount"];
		let meridiansPathsCount = this["latPathsCount"];

		let airportLatLng = this._airportMarker.getLatLng(); // We'll need to add it at both beginning and end
		this[pathName].addLatLng(airportLatLng);

		// Merge selected polygons into one. We'll "mask" generated lines using it.
		let unitedPolygons = undefined;
		for (let name in this.selectedPolygons) {
			if (!this.selectedPolygons.hasOwnProperty(name))
				continue;
			unitedPolygons = this._addSelectedPolygonToGeoJSON(unitedPolygons, name);
		}

		if (unitedPolygons === undefined)
			return;

		// Iterate over each polygon in united multipolygon feature
		let geometry = unitedPolygons.geometry;
		let isMultiPolygon = (geometry.type === "MultiPolygon");
		for (let polygon of geometry.coordinates) {
			let toConvert = isMultiPolygon ? polygon : [polygon]; // This function accepts array of arrays of coordinates. Simple polygons are just arrays of coordinates, so we gotta wrap it.
			let turfPolygon = turfHelpers.polygon(toConvert);
			let box = bbox(turfPolygon); // Create bounding box around current polygon

			// We'll draw paths using bounding box and then clip it by current polygon
			let startLat = box[3]; // Northern lat
			let endLat = box[1]; // Southern lat
			let startLng = box[0]; // Western lng
			let endLng = box[2] // Eastern lng
			let swapPoints = false; // Should swap points on each new line

			// Calculate new distances between paths for current polygon
			let lengthByLat = Math.abs(startLat - endLat);
			let lengthByLng = Math.abs(endLng - startLng);
			let newParallelsPathsCount = parallelsPathsCount * Math.ceil(lengthByLat / this.latDistance);
			let newMeridiansPathsCount = meridiansPathsCount * Math.ceil(lengthByLng / this.lngDistance);
			let parallelsDistance = lengthByLat / newParallelsPathsCount;
			let meridiansDistance = lengthByLng / newMeridiansPathsCount;

			let lat = startLat, lng = startLng;
			let turfPolygonCoordinates = turfPolygon.geometry.coordinates[0] // MathTools.isLineOnEdgeOfPolygon accepts coordinates of the polygon, not polygon itself
			let number = 1;
			while (lat >= endLat && lng <= endLng) {
				let lineCoordinates;
				if (isParallels)
					lineCoordinates = [
						[startLng, lat],
						[endLng, lat]
					];
				else
					lineCoordinates = [
						[lng, startLat],
						[lng, endLat]
					];

				let clippedLine = MathTools.clipLineByPolygon(lineCoordinates, turfPolygonCoordinates);

				// This should not occur, but let's have a handler anyway
				if (clippedLine === undefined) {
					L.polyline([[lat, startLng], [lat, endLng]], {color: "black"}).addTo(this.map);
					lat -= parallelsDistance;
					//continue;
					window.alert("An error occurred in Grid Layer. Please, report it to https://github.com/matafokka/SynthFlight and provide a screenshot of a selected area and all layer's settings.");
					console.log(lineCoordinates, turfPolygonCoordinates);
					break;
				}

				// Extend line by double capture basis to each side
				let index, captureBasis;
				if (isParallels) {
					index = 0;
					captureBasis = this.doubleBasis;
				} else {
					index = 1;
					captureBasis = -this.doubleBasis;
				}

				// WARNING: It somehow modifies polygons when generating paths by parallels! Imagine following selected polygons:
				//   []
				// [][]
				// Then if these lines are present, turf produces following shape:
				//   \]
				// [][]
				// I don't know why it happens, I traced everything. I'll just leave this comment as an explanation and a warning.
				/*clippedLine[0][index] -= captureBasis;
				clippedLine[1][index] += captureBasis;*/

				// Instead, let's just copy our points to the new array. Array.slice() and newClippedLine.push(point) doesn't work either.
				let newClippedLine = [];
				for (let point of clippedLine)
					newClippedLine.push([point[0], point[1]]);
				newClippedLine[0][index] -= captureBasis;
				newClippedLine[1][index] += captureBasis;

				let firstPoint, secondPoint;
				if (swapPoints) {
					firstPoint = newClippedLine[1];
					secondPoint = newClippedLine[0];
				} else {
					firstPoint = newClippedLine[0];
					secondPoint = newClippedLine[1];
				}

				// This line will be added to pathsWithoutConnectionsGroup
				let line = L.polyline([], {
					color: this[color],
					weight: this.lineThickness
				});

				for (let point of [firstPoint, secondPoint]) {
					// Add points to the path
					let coord = [point[1], point[0]];
					this[pathName].addLatLng(coord);

					if (hideEverything)
						continue;

					line.addLatLng(coord);

					// Add numbers
					if (this._doHidePathsNumbers)
						continue;
					let id = "pt" + pathName + number;
					this.labelsGroup.addLabel(id, coord, number, L.LabelLayer.DefaultDisplayOptions[isParallels ? "Message" : "Error"]);
					number++;
				}
				this.pathsWithoutConnectionsGroup.addLayer(line);

				swapPoints = !swapPoints;
				if (isParallels)
					lat -= parallelsDistance;
				else
					lng += meridiansDistance;

			}
		}
		this[pathName].addLatLng(airportLatLng);

		// Calculate parameters based on paths length
		let pathLength = Math.round(this.lineLengthUsingFlightHeight(this[pathName]));
		let flightTime = parseFloat((pathLength / this.aircraftSpeedInMetersPerSecond / 3600).toFixed(2));

		let params = [
			["pathLength", "PathsLength", pathLength],
			["flightTime", "FlightTime", flightTime],
			["pathsCount", "PathsCount", this[nameForOutput + "PathsCount"]]
		];
		for (let param of params) {
			let value = param[2];
			this[pathName][param[0]] = value;
			this.getControlById(nameForOutput + param[1]).setValue(value);
		}

		if (hideEverything)
			return;

		// Display either polyline or paths without connections
		if (this._doHidePathsConnections) {
			this[pathName].remove();
			this.map.addLayer(this.pathsWithoutConnectionsGroup);
		} else {
			this.pathsWithoutConnectionsGroup.remove();
			this.map.addLayer(this[pathName]);
		}
		this.addLayers(this[pathName]);
	},

	/**
	 * Calculates line length using haversine formula with accounting of flight height
	 * @param line
	 * @return {number}
	 */
	lineLengthUsingFlightHeight: function (line) {
		let r = 6371000 + this["flightHeight"];
		let points = line.getLatLngs();
		let distance = 0;
		for (let i = 0; i < points.length - 1; i++) {
			let p1 = points[i], p2 = points[i + 1];
			let f1 = turfHelpers.degreesToRadians(p1.lat), f2 = turfHelpers.degreesToRadians(p2.lat);
			let df = f2 - f1;
			let dl = turfHelpers.degreesToRadians(p2.lng - p1.lng);
			let a = Math.sin(df / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
			distance += r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		}
		return distance;
	},

	/**
	 * Truncates argument to fifth number after point.
	 * @param n Number to truncate
	 * @return {number} Truncated number
	 */
	toFixed: function (n) {
		return parseFloat(n.toFixed(5));
	},

	/**
	 * Merges selected polygon into one GeoJSON feature.
	 * @param currentGeoJSON Current GeoJSON object
	 * @param name {string} Name of current polygon
	 * @return Merged feature
	 * @private
	 */
	_addSelectedPolygonToGeoJSON: function (currentGeoJSON, name) {
		let polygonGeoJSON = this.selectedPolygons[name].toGeoJSON();
		if (currentGeoJSON === undefined) {
			currentGeoJSON = polygonGeoJSON;
			return currentGeoJSON;
		}
		currentGeoJSON = union(currentGeoJSON, polygonGeoJSON);
		return currentGeoJSON;
	},

	toGeoJSON: function () {
		let jsons = [];
		for (let name in this.selectedPolygons) {
			if (!this.selectedPolygons.hasOwnProperty(name))
				continue;
			let polygon = this.selectedPolygons[name];
			let polygonJson = polygon.toGeoJSON();
			let props = ["polygonName", "minHeight", "maxHeight", "meanHeight", "absoluteHeight", "reliefType", "elevationDifference"];
			for (let prop of props)
				polygonJson.properties[prop] = polygon[prop];
			polygonJson.properties.name = "Selected cell";
			jsons.push(polygonJson);
		}

		let airport = this._airportMarker.toGeoJSON();
		airport.name = "Airport";
		jsons.push(airport);

		if (this["pathsByMeridians"].isEmpty() || this["pathsByParallels"].isEmpty()) {
			window.alert(`No paths has been drawn in layer \"${this.name}\"! You'll get only selected gird cells and airport position.`);
			return geojsonMerge.merge(jsons);
		}

		let meridianJson = this["pathsByMeridians"].toGeoJSON();
		meridianJson.properties.name = "Flight paths by meridians";
		let parallelsJson = this["pathsByParallels"].toGeoJSON();
		parallelsJson.properties.name = "Flight paths by parallels";

		// See _calculateParameters
		let params = ["cameraWidth", "cameraHeight", "pixelWidth", "focalLength", "flightHeight", "overlayBetweenPaths", "overlayBetweenImages", "imageScale", "ly", "Ly", "By", "lx", "Lx", "Bx", "GSI", "IFOV", "GIFOV", "FOV", "GFOV", "latCellSizeInMeters", "lngCellSizeInMeters", "selectedArea"];
		for (let line of [meridianJson, parallelsJson]) {
			for (let param of params)
				line.properties[param] = this[param];
			jsons.push(line)
		}

		let lines = [
			["pathsByParallels", parallelsJson],
			["pathsByMeridians", meridianJson]
		];
		let lineParams = ["pathLength", "flightTime", "pathsCount"];
		for (let line of lines) {
			for (let param of lineParams)
				line[1].properties[param] = this[line[0]][param];
		}

		return geojsonMerge.merge(jsons);
	}

});