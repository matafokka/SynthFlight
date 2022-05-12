const bbox = require("@turf/bbox").default;
const turfArea = require("@turf/area").default;
const MathTools = require("../MathTools.js");
const turfHelpers = require("@turf/helpers");

L.ALS.SynthRectangleBaseLayer.prototype.clearPaths = function () {
	L.ALS.SynthPolygonBaseLayer.prototype.clearPaths.call(this);
	this.clearLabels("pathsLabelsIds");
}

L.ALS.SynthRectangleBaseLayer.prototype.drawPaths = function () {
	this.clearPaths();

	if (this.mergedPolygons.length === 0)
		return;

	this.drawPathsWorker(true);
	this.drawPathsWorker(false);
	this.updatePathsMeta();
	this.labelsGroup.redraw();
}

/**
 * Draws flight paths. Use drawPaths wrapper to draw paths instead of this.
 * @private
 */
L.ALS.SynthRectangleBaseLayer.prototype.drawPathsWorker = function (isParallels) {

	let pathGroup, nameForOutput, color, connectionsGroup, widgetId, extensionIndex;
	if (isParallels) {
		pathGroup = this.pathsByParallels;
		connectionsGroup = this.parallelsInternalConnections;
		nameForOutput = "lng";
		color = this["color0"];
		widgetId = "hidePathsByParallels";
		extensionIndex = 0;
	} else {
		pathGroup = this.pathsByMeridians;
		connectionsGroup = this.meridiansInternalConnections;
		nameForOutput = "lat";
		color = this["color1"];
		widgetId = "hidePathsByMeridians";
		extensionIndex = 1;
	}
	let pointsName = nameForOutput + "PointsGroup",
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

			lat = startLat, lng = startLng,
			turfPolygonCoordinates = turfPolygon.geometry.coordinates[0], // MathTools accepts coordinates of the polygon, not polygon itself
			number = 1, connectionLine = new L.WrappedPolyline([], connLineOptions),
			prevLine, shouldDraw = true;

		connectionLine.actualPaths = [];
		connectionLine.selectedArea = turfArea(turfPolygon);

		while (shouldDraw) {
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

			// When we reach end of the polygon, we should add one more path in any case.
			// It'll be outside of polygon, so we have to get use previous line as clipped line.
			// It should also mark end of the loop.
			if (!clippedLine) {
				clippedLine = [];
				shouldDraw = false;
				for (let lngLat of prevLine) {
					if (isParallels)
						clippedLine.push([lngLat[0], lat]);
					else
						clippedLine.push([lng, lngLat[1]]);
				}
			}
			prevLine = clippedLine;

			// WARNING: Clipping somehow modifies polygons when generating paths by parallels!
			// Imagine following selected polygons:
			//   []
			// [][]
			// Then if these lines are present, turf produces following shape:
			//   \]
			// [][]
			// I don't know why it happens, I traced everything. I'll just leave this comment as an explanation and a warning.

			// Instead, let's just copy our points to the new array. Array.slice() and newClippedLine.push(point) doesn't work either.
			let newClippedLine = [];
			for (let point of clippedLine)
				newClippedLine.push([point[0], point[1]]);

			// Extend the line, so it'll hold whole number of images + double basis, i.e. two images from each side
			let length = this.getParallelOrMeridianLineLength(newClippedLine[0], newClippedLine[1], false),
				numberOfImages = Math.ceil(length / this.Bx) + 4,
				extendBy = (this.Bx * numberOfImages - length) / 2,
				multiplier = isParallels ? -1 : 1; // We'll start from the leftmost or topmost point

			for (let point of newClippedLine) {
				point[extensionIndex] += multiplier * this.getArcAngleByLength(newClippedLine[1], extendBy, !isParallels);
				multiplier *= -1;
			}

			let startPoint = newClippedLine[0], endPoint = newClippedLine[1]; // Points for generating capturing points
			let firstPoint, secondPoint; // Points for generating lines
			if (swapPoints) {
				firstPoint = endPoint;
				secondPoint = startPoint;
			} else {
				firstPoint = startPoint;
				secondPoint = endPoint;
			}

			let line = new L.WrappedPolyline([], lineOptions); // Contains paths with turns, i.e. internal connections

			for (let point of [firstPoint, secondPoint]) {
				// Add points to the path
				let coord = [point[1], point[0]];
				line.addLatLng(coord);
				connectionLine.addLatLng(coord);

				// Add numbers
				if (shouldHideNumbers)
					continue;

				let labelId = L.ALS.Helpers.generateID();
				this.pathsLabelsIds.push(labelId);
				this.labelsGroup.addLabel(labelId, L.latLng(coord).wrap(), number, L.LabelLayer.DefaultDisplayOptions[isParallels ? "Message" : "Error"]);
				number++;
			}

			pathGroup.addLayer(line);
			connectionLine.actualPaths.push(line);

			// Add capture points
			let [ptLng, ptLat] = startPoint, [ptEndLng, ptEndLat] = endPoint;
			while (MathTools.isGreaterThanOrEqualTo(ptLat, ptEndLat) && MathTools.isLessThanOrEqualTo(ptLng, ptEndLng)) {
				this[pointsName].addLayer(this.createCapturePoint([ptLat, ptLng], color));

				let moveBy = this.getArcAngleByLength([ptLng, ptLat], this.Bx, !isParallels);
				if (isParallels)
					ptLng += moveBy;
				else
					ptLat -= moveBy;
			}

			swapPoints = !swapPoints;

			let moveBy = this.getArcAngleByLength([ptLng, ptLat], this.By, isParallels);
			if (isParallels)
				lat -= moveBy;
			else
				lng += moveBy;
		}
		connectionsGroup.addLayer(connectionLine);
	}
}