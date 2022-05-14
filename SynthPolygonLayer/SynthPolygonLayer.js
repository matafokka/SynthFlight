require("./SynthPolygonWizard.js");
require("./SynthPolygonSettings.js");
const MathTools = require("../MathTools.js");
const proj4 = require("proj4");
const debounce = require("debounce")

/**
 * Polygon layer
 *
 * @class
 * @extends L.ALS.SynthPolygonBaseLayer
 */
L.ALS.SynthPolygonLayer = L.ALS.SynthPolygonBaseLayer.extend(/** @lends L.ALS.SynthPolygonLayer.prototype */{

	calculateCellSizeForPolygons: false,
	defaultName: "Polygon Layer",
	borderColorLabel: "rectangleBorderColor",
	fillColorLabel: "rectangleFillColor",

	init: function (wizardResults, settings) {
		this.copySettingsToThis(settings);

		/**
		 * 89 degrees geodesic line length in meters. Gnomonic projection can't display points starting from 90 deg from the center.
		 * @type {number}
		 */
		this.maxGnomonicPointDistance = this.getEarthRadius() * 89 * Math.PI / 180;

		this.internalConnections = new L.FeatureGroup();
		this.externalConnections = new L.FeatureGroup();
		this.pathGroup = new L.FeatureGroup();
		this.pointsGroup = new L.FeatureGroup();

		L.ALS.SynthPolygonBaseLayer.prototype.init.call(this, settings,
			this.internalConnections,
			this.externalConnections,
			this.pathGroup,
			this.pointsGroup,
			"polygonPathsColor",
			"polygonHidePaths",
		);

		this.enableDraw({
			polygon: {
				shapeOptions: {
					color: "#ff0000",
					weight: this.lineThicknessValue
				}
			},

			rectangle: {
				shapeOptions: {
					color: "#ff0000",
					weight: this.lineThicknessValue
				}
			}
		}, this.polygonGroup);

		this.calculateThreshold(settings); // Update hiding threshold
		this.onEditEndDebounced = debounce((notifyIfLayersSkipped = false) => this.onEditEnd(notifyIfLayersSkipped), 300); // Math operations are too slow for immediate update

		L.ALS.SynthGeometryBaseWizard.initializePolygonOrPolylineLayer(this, wizardResults);
	},

	onEditEnd: function (notifyIfLayersSkipped = true) {
		if (!this.isSelected)
			return;

		let color = this.getWidgetById("color0").getValue(),
			lineOptions = {color, thickness: this.lineThicknessValue, segmentsNumber: L.GEODESIC_SEGMENTS},
			calculationsLineOptions = {segmentsNumber: 2}

		for (let name in this.polygons)
			this.removePolygon(this.polygons[name], false);

		this.labelsGroup.deleteAllLabels();
		this.polygons = {}
		this.invalidPolygons = {};

		this.clearPaths();

		let layersWereInvalidated = false;
		notifyIfLayersSkipped = typeof notifyIfLayersSkipped === "boolean" ? notifyIfLayersSkipped : true;

		// Build paths for each polygon.

		// The heuristics follows an assumption that the shortest path will always be parallel
		// to the edge of the polygon.

		// To build parallel paths, first, we build a line that is perpendicular to the edge (let's call it directional).
		// Then, for each intermediate point (distances between points are equal to By) of the directional line,
		// we build a line that is perpendicular to the directional line - a path.

		// Sometimes we can't use an edge (i.e. when polygon is star-shaped) because directional line won't cover the
		// whole polygon. To fix that, we'll build paths using convex hull which'll allow us to get rid of two problems:

		// 1. Star-shaped polygons.
		// 2. Crop the line by polygon to determine correct perpendicular direction. To do so, we'll draw a directional
		// line from the center of the edge. I haven't found any other way of determining direction when drawing from
		// the first point of the edge, there's just no common properties of polygon's configurations I've tested.

		// To work with geodesics as vectors and lines, we'll use gnomonic projection.
		// We'll also crop the paths by the hull, so there won't be empty space along the paths.

		this.polygonGroup.eachLayer((layer) => {
			// Remove a linked layer when a layer either original or cloned has been removed
			if (layer.linkedLayer && !this.polygonGroup.hasLayer(layer.linkedLayer)) {
				this.polygonGroup.removeLayer(layer);
				return;
			}

			// Skip cloned layers
			if (layer.isCloned)
				return;

			this.cloneLayerIfNeeded(layer);

			// Build projection. The center will be the center of the polygon. It doesn't matter that much, but center
			// Allows us to expand polygon size a bit when it's close to the projection's coordinates limits.
			let center = layer.getBounds().getCenter(),
				proj = proj4("+proj=longlat +ellps=sphere +no_defs", `+proj=gnom +lat_0=${center.lat} +lon_0=${center.lng} +x_0=0 +y_0=0 +ellps=sphere +R=${this.getEarthRadius()} +units=m +no_defs`),

				// Get convex hull and initialize variables for the shortest path
				{upper, lower} = this.getConvexHull(L.LatLngUtil.cloneLatLngs(layer.getLatLngs()[0])),
				projectedPolygon = [],
				minLength = Infinity, shortestPath, shortestPathConnections, shortestPathPoints;

			// Remove same points from the hull
			upper.pop();
			lower.pop();

			// Project the hull
			for (let part of [lower, upper]) {
				for (let coord of part) {
					let point = proj.forward([coord.lng, coord.lat]);
					if (!this.isPointValid(point)) {
						layersWereInvalidated = true;
						this.invalidatePolygon(layer);
						return;
					}
					projectedPolygon.push(point);
				}
			}

			projectedPolygon.push(projectedPolygon[0]); // Close the polygon

			// For each edge
			for (let i = 0; i < projectedPolygon.length - 1; i++) {
				// Build a directional line
				let edgeP1 = projectedPolygon[i], edgeP2 = projectedPolygon[i + 1],
					directionalLine = this.perpendicularLine(edgeP1, edgeP2, projectedPolygon, true),
					// Initialize variables for the current path
					currentPath = [], currentConnections = [], currentLength = 0, currentPoints = [],
					shouldSwapPoints = false, lineAfterPolygonAdded = false;

				// Precalculate paths' count and invalidate layer if this count is too high
				if (MathTools.distanceBetweenPoints(...directionalLine) / this.By > 50) {
					layersWereInvalidated = true;
					this.invalidatePolygon(layer);
					return;
				}

				// Move along the line by By until we reach the end of the polygon and add an additional line
				// or exceed the limit of 300 paths
				let deltaBy = 0;
				while (true) {
					if (lineAfterPolygonAdded)
						break;

					// Scale the directional line, so endpoints of scaled line will be the start and end points of the
					// line that we'll build a perpendicular (a path) to. The distance between these points is By.
					let p1 = this.scaleLine(directionalLine, deltaBy)[1],
						p2 = this.scaleLine(directionalLine, deltaBy + this.By)[1],
						line = this.perpendicularLine(p1, p2, projectedPolygon);

					if (!line) {
						// If it's the first point, use an edge as an intersection. This shouldn't happen but I like to
						// be extra careful.
						if (deltaBy === 0)
							line = [edgeP1, edgeP2];
						else {
							// Otherwise, we've passed the polygon and we have to add another line, i.e. move it along
							// directional line. To do so, get x and y differences between current path and previous
							// path. Then move cloned path by these differences.
							let dx = p2[0] - p1[0],
								dy = p2[1] - p1[1],
								[prevPathP1, prevPathP2] = currentPath[currentPath.length - 1].getLatLngs(),
								[p1x, p1y] = proj.forward([prevPathP1.lng, prevPathP1.lat]),
								[p2x, p2y] = proj.forward([prevPathP2.lng, prevPathP2.lat]);
							p1x += dx;
							p2x += dx;
							p1y += dy;
							p2y += dy;

							line = [[p1x, p1y], [p2x, p2y]];
							lineAfterPolygonAdded = true;
						}
					}

					// Swap points of each odd path
					if (shouldSwapPoints)
						line.reverse();

					shouldSwapPoints = !shouldSwapPoints;

					// Build a path
					let path = new L.Geodesic([
							proj.inverse(line[0]).reverse(),
							proj.inverse(line[1]).reverse(),
						], calculationsLineOptions),
						length = path.statistics.sphericalLengthMeters,
						numberOfImages = Math.ceil(length / this.Bx), extendBy;

					if (lineAfterPolygonAdded) {
						extendBy = 0; // Don't extend copied line
					} else {
						numberOfImages += 4;
						extendBy = (this.Bx * numberOfImages - length) / 2 / length;
					}

					if (numberOfImages > 100) {
						layersWereInvalidated = true;
						this.invalidatePolygon(layer);
						return;
					}

					// If current length is already greater than previous, break loop and save some time
					if (currentLength + length + length * extendBy >= minLength) {
						currentLength = Infinity;
						break;
					}

					// Try change length to fit new basis. GeodesicLine will throw when new length exceeds 180 degrees.
					// In this case, invalidate current polygon.
					if (!lineAfterPolygonAdded) {
						try {
							path.changeLength("both", extendBy);
						} catch (e) {
							layersWereInvalidated = true;
							this.invalidatePolygon(layer);
							return;
						}
					}

					// Push the stuff related to the current paths to the arrays
					let pathEndPoints = path.getLatLngs();

					currentPath.push(path);
					currentLength += path.statistics.sphericalLengthMeters;
					currentConnections.push(...pathEndPoints);

					// Fill in capture points.
					let pointsArrays = new L.Geodesic(pathEndPoints, {segmentsNumber: numberOfImages}).getActualLatLngs();

					for (let array of pointsArrays) {
						for (let point of array)
							currentPoints.push(this.createCapturePoint(point, color));
					}

					deltaBy += this.By;
				}

				if (currentLength >= minLength)
					continue;

				minLength = currentLength;
				shortestPath = currentPath;
				shortestPathConnections = currentConnections;
				shortestPathPoints = currentPoints;
			}

			this.addPolygon(layer, center);

			this.internalConnections.addLayer(new L.Geodesic(shortestPathConnections, {
				...lineOptions,
				dashArray: this.dashedLine,
			}));

			let number = 1;
			for (let path of shortestPath) {
				this.pathGroup.addLayer(new L.Geodesic(path.getLatLngs(), lineOptions));

				// Add numbers
				let latLngs = path.getLatLngs();

				for (let point of latLngs) {
					let {lat, lng} = point.wrap();
					this.labelsGroup.addLabel("", [lat, lng], number, L.LabelLayer.DefaultDisplayOptions.Message);
					number++;
				}
			}

			for (let marker of shortestPathPoints)
				this.pointsGroup.addLayer(marker);
		});

		if (layersWereInvalidated && notifyIfLayersSkipped)
			window.alert(L.ALS.locale.polygonLayersSkipped);

		this.map.addLayer(this.labelsGroup); // Nothing in the base layer hides or shows it, so it's only hidden in code above
		this.updatePathsMeta();
		this.updateLayersVisibility();
		this.writeToHistoryDebounced();
	},

	calculateParameters: function (notifyIfLayersSkipped = false) {
		L.ALS.SynthPolygonBaseLayer.prototype.calculateParameters.call(this);
		this.onEditEndDebounced(typeof notifyIfLayersSkipped === "boolean" ? notifyIfLayersSkipped : false);
	},

	updateLayersVisibility: function () {
		L.ALS.SynthPolygonBaseLayer.prototype.updateLayersVisibility.call(this);
		this.hideOrShowLayer(this._doHidePathsNumbers || this.getWidgetById("polygonHidePaths").getValue(), this.labelsGroup);
	},

	/**
	 * Builds an "infinite" perpendicular line to the given line defined by p1 and p2 (let's call it reference line).
	 * Then crops the perpendicular by the given polygon and returns it.
	 *
	 * First point of the perpendicular always lies on the reference line.
	 *
	 * @param p1 {number[]} First point of the reference line
	 * @param p2 {number[]} Second point of the reference line
	 * @param polygon {number[][]} Polygon to crop perpendicular with.
	 * @param moveToCenter {boolean} If true, perpendicular will be drawn from the center of the reference line. Otherwise, perpendicular will be drawn from p1.
	 * @returns {number[][]|undefined} Perpendicular or undefined, if line doesn't intersect the polygon.
	 */
	perpendicularLine: function (p1, p2, polygon, moveToCenter = false) {
		let [p1x, p1y] = p1, [p2x, p2y] = p2,
			x = p2x - p1x, y = p2y - p1y,
			perpX, perpY;

		// Find an orthogonal vector
		if (y === 0) {
			// Build vertical line for horizontal reference lines
			perpX = 0;
			perpY = 1000;
		} else {
			// Build orthogonal vectors for other lines
			perpX = 1000;
			perpY = -perpX * x / y;
		}

		// For each negative and positive directions
		let line = [];
		for (let sign of [1, -1]) {
			// Scale the perpendicular to the maximum distance in gnomonic projection
			let [px, py] = this.scaleLine([[0, 0], [sign * perpX, sign * perpY]], this.maxGnomonicPointDistance)[1];

			// Move perpendicular back
			px += p1x;
			py += p1y;

			if (moveToCenter) {
				// Move perpendicular by the half of the original vector
				px += x / 2;
				py += y / 2;
			}

			line.push([px, py]);
		}

		let clippedLine = MathTools.clipLineByPolygon(line, polygon);

		if (!clippedLine)
			return;

		return MathTools.isPointOnLine(clippedLine[0], [p1, p2]) ? clippedLine : clippedLine.reverse();
	},

	/**
	 * Scales the line from the first point to the target length
	 *
	 * @param line {number[][]} Line to scale
	 * @param targetLength {number} Target line length in meters
	 * @returns {number[][]} Scaled line
	 */
	scaleLine: function (line, targetLength) {
		let [p1, p2] = line, [p1x, p1y] = p1, [p2x, p2y] = p2,
			dx = p2x - p1x, dy = p2y - p1y,
			lengthModifier = targetLength / Math.sqrt(dx ** 2 + dy ** 2);
		dx *= lengthModifier;
		dy *= lengthModifier;
		return [[p1x, p1y], [dx + p1x, dy + p1y]];
	},

	isPointValid: function (point) {
		return Math.sqrt(point[0] ** 2 + point[1] ** 2) <= this.maxGnomonicPointDistance;
	},

	statics: {
		wizard: L.ALS.SynthPolygonWizard,
		settings: new L.ALS.SynthPolygonSettings(),
	}
});