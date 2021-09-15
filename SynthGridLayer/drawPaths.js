const bbox = require("@turf/bbox").default;
const MathTools = require("../MathTools.js");
const turfHelpers = require("@turf/helpers");

L.ALS.SynthGridLayer.prototype._drawPaths = function () {
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
			weight: this.lineThicknessValue
		});
	}

	let groupsToClear = ["pathsWithoutConnectionsGroup", "latPointsGroup", "lngPointsGroup"];
	for (let group of groupsToClear)
		this[group].clearLayers();

	// Validate parameters

	let errorLabel = this.getWidgetById("calculateParametersError");
	let parallelsPathsCount = this["lngPathsCount"];
	let meridiansPathsCount = this["latPathsCount"];

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

	this._drawPathsWorker(true)
	this._drawPathsWorker(false);
}

/**
 * Draws flight paths. Use _drawPaths wrapper to draw paths instead of this.
 * @private
 */
L.ALS.SynthGridLayer.prototype._drawPathsWorker = function (isParallels) {
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
	let pointsName = nameForOutput + "PointsGroup";

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

		// Calculate correct capture basis in degrees.
		let latDistance = Math.abs(endLat - startLat), lngDistance = Math.abs(endLng - startLng);
		let latPointsCount = Math.round(latDistance / this.basis);
		let lngPointsCount = Math.round(lngDistance / this.basis);

		let latBasis = latDistance / latPointsCount, lngBasis = lngDistance / lngPointsCount;

		let lat = startLat, lng = startLng;
		let turfPolygonCoordinates = turfPolygon.geometry.coordinates[0] // MathTools accepts coordinates of the polygon, not polygon itself
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
				captureBasis = lngBasis * 2;
			} else {
				index = 1;
				captureBasis = -latBasis * 2;
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

			let startPoint = newClippedLine[0], endPoint = newClippedLine[1]; // Points for generating capturing points
			let firstPoint, secondPoint; // Points for generating lines
			if (swapPoints) {
				firstPoint = endPoint;
				secondPoint = startPoint;
			} else {
				firstPoint = startPoint;
				secondPoint = endPoint;
			}

			// This line will be added to pathsWithoutConnectionsGroup
			let line = L.polyline([], {
				color: this[color],
				weight: this.lineThicknessValue
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

			// Add capture points
			let ptLat = startPoint[1], ptLng = startPoint[0], ptEndLat = endPoint[1], ptEndLng = endPoint[0];

			let ptColor = isParallels ? this.parallelsColor : this.meridiansColor;
			while (MathTools.isGreaterThanOrEqualTo(ptLat, ptEndLat) && MathTools.isLessThanOrEqualTo(ptLng, ptEndLng)) {
				let circle = L.circleMarker([ptLat, ptLng], {
					radius: this.lineThicknessValue * 2,
					stroke: false,
					fillOpacity: 1,
					fill: true,
					fillColor: ptColor,
				});
				this[pointsName].addLayer(circle);
				if (isParallels)
					ptLng += lngBasis;
				else
					ptLat -= latBasis;
			}

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
		this.getWidgetById(nameForOutput + param[1]).setValue(value);
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
}