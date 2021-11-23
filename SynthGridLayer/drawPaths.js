const bbox = require("@turf/bbox").default;
const MathTools = require("../MathTools.js");
const turfHelpers = require("@turf/helpers");

L.ALS.SynthGridLayer.prototype._drawPaths = function () {
	// Remove previously added paths
	let groupsToClear = [this.pathsByParallels, this.pathsByMeridians, this.meridiansExternalConnections, this.meridiansInternalConnections, this.parallelsExternalConnections, this.parallelsInternalConnections, this.latPointsGroup, this.lngPointsGroup];
	for (let group of groupsToClear)
		group.clearLayers();

	for (let id of this._pathsLabelsIDs)
		this.labelsGroup.deleteLabel(id);
	this._pathsLabelsIDs = [];

	// Validate parameters

	let errorLabel = this.getWidgetById("calculateParametersError");
	let parallelsPathsCount = this["lngFakePathsCount"];
	let meridiansPathsCount = this["latFakePathsCount"];

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

	if (this.mergedPolygons.length === 0)
		return;

	this._drawPathsWorker(true)
	this._drawPathsWorker(false);
	this.updatePathsMeta();
	this.labelsGroup.redraw();
}

/**
 * Draws flight paths. Use _drawPaths wrapper to draw paths instead of this.
 * @private
 */
L.ALS.SynthGridLayer.prototype._drawPathsWorker = function (isParallels) {

	let pathName, nameForOutput, color, connectionsGroup, widgetId, extensionIndex;
	if (isParallels) {
		pathName = "pathsByParallels";
		connectionsGroup = this.parallelsInternalConnections;
		nameForOutput = "lng";
		color = this["color0"];
		widgetId = "hidePathsByParallels";
		extensionIndex = 0;
	} else {
		pathName = "pathsByMeridians";
		connectionsGroup = this.meridiansInternalConnections;
		nameForOutput = "lat";
		color = this["color1"];
		widgetId = "hidePathsByMeridians";
		extensionIndex = 1;
	}
	let pathGroup = this[pathName],
		pointsName = nameForOutput + "PointsGroup",
		lineOptions = {
			color,
			weight: this.lineThicknessValue
		},
		connLineOptions = {
			color,
			weight: this.lineThicknessValue,
			dashArray: this.dashedLine,
		};

	let shouldHideNumbers = this.getWidgetById(widgetId).getValue() || this._doHidePathsNumbers;

	for (let polygon of this.mergedPolygons) {
		let turfPolygon = turfHelpers.polygon([polygon]), // This function accepts array of arrays of coordinates. Our polygons are just arrays of coordinates, so we gotta wrap it.
			[startLng, endLat, endLng, startLat] = bbox(turfPolygon), // Create bounding box around current polygon. We'll draw paths using bounding box and then clip it by current polygon
			swapPoints = false, // Should swap points on each new line

			// Calculate new distances between paths for current polygon
			lengthByLat = Math.abs(startLat - endLat),
			lengthByLng = Math.abs(endLng - startLng),
			parallelsDistance = lengthByLat * this.By / this.getLineLengthMeters([[startLng, startLat], [startLng, endLat]], false),
			meridiansDistance = lengthByLng * this.By / this.getLineLengthMeters([[startLng, startLat], [endLng, startLat]], false),

			// Calculate correct capture basis in degrees.
			bottomSide = [[startLng, endLat], [startLng + this.lngDistance, endLat]],
			rightSide = [[endLng, startLat], [endLng, startLat - this.latDistance]],
			parallelsPointsCount = Math.ceil(this.getLineLengthMeters(bottomSide, false) / this.Bx),
			meridiansPointsCount = Math.ceil(this.getLineLengthMeters(rightSide, false) / this.Bx),

			parallelsBasis = this.getLineLength(bottomSide) / parallelsPointsCount, meridiansBasis = this.getLineLength(rightSide) / meridiansPointsCount,
			extendBy = isParallels ? parallelsBasis * 2 : -meridiansBasis * 2,

			lat = startLat, lng = startLng,
			turfPolygonCoordinates = turfPolygon.geometry.coordinates[0], // MathTools accepts coordinates of the polygon, not polygon itself
			number = 1, connectionLine = L.polyline([], connLineOptions),
			prevLine;

		connectionLine.actualPaths = [];

		while (MathTools.isGreaterThanOrEqualTo(lat, endLat) && MathTools.isLessThanOrEqualTo(lng, endLng)) {
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

			// Line can be outside of polygon, so we have to get use previous line as clipped line
			// TODO: Remove?
			if (!clippedLine) {
				clippedLine = [];
				for (let lngLat of prevLine) {
					if (isParallels)
						clippedLine.push([lngLat[0], lat]);
					else
						clippedLine.push([lng, lngLat[1]]);
				}
			}
			prevLine = clippedLine;

			// WARNING: It somehow modifies polygons when generating paths by parallels! Imagine following selected polygons:
			//   []
			// [][]
			// Then if these lines are present, turf produces following shape:
			//   \]
			// [][]
			// I don't know why it happens, I traced everything. I'll just leave this comment as an explanation and a warning.
			/*clippedLine[0][extensionIndex] -= extendBy;
			clippedLine[1][extensionIndex] += extendBy;*/

			// Instead, let's just copy our points to the new array. Array.slice() and newClippedLine.push(point) doesn't work either.
			let newClippedLine = [];
			for (let point of clippedLine)
				newClippedLine.push([point[0], point[1]]);

			// Extend line by double capture basis to each side
			newClippedLine[0][extensionIndex] -= extendBy;
			newClippedLine[1][extensionIndex] += extendBy;

			let startPoint = newClippedLine[0], endPoint = newClippedLine[1]; // Points for generating capturing points
			let firstPoint, secondPoint; // Points for generating lines
			if (swapPoints) {
				firstPoint = endPoint;
				secondPoint = startPoint;
			} else {
				firstPoint = startPoint;
				secondPoint = endPoint;
			}

			let line = L.polyline([], lineOptions); // Contains paths with turns, i.e. internal connections

			for (let point of [firstPoint, secondPoint]) {
				// Add points to the path
				let coord = [point[1], point[0]];
				line.addLatLng(coord);
				connectionLine.addLatLng(coord);

				// Add numbers
				if (shouldHideNumbers)
					continue;

				let labelId = L.ALS.Helpers.generateID();
				this._pathsLabelsIDs.push(labelId);
				this.labelsGroup.addLabel(labelId, coord, number, L.LabelLayer.DefaultDisplayOptions[isParallels ? "Message" : "Error"]);
				number++;
			}

			pathGroup.addLayer(line);
			connectionLine.actualPaths.push(line);

			// Add capture points
			let [ptLng, ptLat] = startPoint, [ptEndLng, ptEndLat] = endPoint;
			while (MathTools.isGreaterThanOrEqualTo(ptLat, ptEndLat) && MathTools.isLessThanOrEqualTo(ptLng, ptEndLng)) {
				let circle = L.circleMarker([ptLat, ptLng], {
					radius: this.lineThicknessValue * 2,
					stroke: false,
					fillOpacity: 1,
					fill: true,
					fillColor: color,
				});
				this[pointsName].addLayer(circle);
				if (isParallels)
					ptLng += parallelsBasis;
				else
					ptLat -= meridiansBasis;
			}

			swapPoints = !swapPoints;
			if (isParallels)
				lat -= parallelsDistance;
			else
				lng += meridiansDistance;

		}
		connectionsGroup.addLayer(connectionLine);
	}
}