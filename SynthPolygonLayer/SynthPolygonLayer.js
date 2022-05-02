require("./SynthPolygonWizard.js");
require("./SynthPolygonSettings.js");
const MathTools = require("../MathTools.js");
const proj4 = require("proj4");

L.ALS.SynthPolygonLayer = L.ALS.SynthPolygonBaseLayer.extend({

	calculateCellSizeForPolygons: false,
	defaultName: "Polygon Layer",
	borderColorLabel: "rectangleBorderColor",
	fillColorLabel: "rectangleFillColor",

	init: function (wizardResults, settings) {
		this.copySettingsToThis(settings);

		this.internalConnections = L.featureGroup();
		this.externalConnections = L.featureGroup();
		this.pathGroup = L.featureGroup();
		this.pointsGroup = L.featureGroup();

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
			}
		}, this.polygonGroup);

		this.calculateThreshold(settings); // Update hiding threshold
		this.calculateParameters();
		this.updateLayersVisibility();
	},

	onEditEnd: function () {
		let color = this.getWidgetById("color0").getValue(),
			lineOptions = {
				color, thickness: this.lineThicknessValue, segmentsNumber: L.GEODESIC_SEGMENTS,
			}

		for (let name in this.polygons)
			this.removePolygon(this.polygons[name], false);
		this.polygons = {}

		this.clearPaths();

		let layersWereRemoved = false;

		// Build paths for each polygon.

		// The heuristics follows an assumption that the shortest path will always be parallel
		// to the edge of the polygon.

		// To build parallel paths, first, we build a line that is perpendicular to the edge (let's call it directional).
		// Then, for each intermediate point (distances between points are equal to By) of the directional line,
		// we build a line that is perpendicular to the directional line - a path.
		// Then we crop the path by polygon by projecting both path and polygon to the WebMercator.

		// Sometimes we can't use an edge (i.e. when polygon is star-shaped).
		// To fix that, we'll build paths using convex hull which'll allow us to get rid of two problems:

		// 1. Star-shaped polygons.
		// 2. Determining where directional line should be headed. For upper part of the convex hull the direction
		// is downwards. For lower, upwards.

		// For building perpendicular lines, we'll use gnomonic projection to which we can transfer some
		// properties of Euclidean 2D space.
		this.polygonGroup.eachLayer((layer) => {
			let latLngs = layer.getLatLngs()[0],
				{upper, lower} = this.getConvexHull(L.LatLngUtil.cloneLatLngs(latLngs)),
				projectedPolygon = [], minLength = Infinity, shortestPath, shortestPathConnections, shortestPathPoints;

			// Convert polygon coords to layer points, so we can use MathTools
			for (let coord of latLngs) {
				let {x, y} = this.map.project(coord, 0);
				projectedPolygon.push([x, y]);
			}
			projectedPolygon.push(projectedPolygon[0]);
			latLngs.push(latLngs[0]);

			// For upper part, perpendiculars should be headed downwards, for lower, upwards
			upper.direction = -1;
			lower.direction = 1;

			for (let part of [upper, lower]) {
				for (let i = 0; i < part.length - 1; i++) {
					// Get a directional line
					let line = this.perpendicularLine(part[i], part[i + 1], this.By, "end", part.direction),
						perpLinePoints = line.getActualLatLngs()[0],
						currentPath = [], currentConnections = [], currentLength = 0, currentPoints = [],
						shouldSwapPoints = false, lineAfterPolygonAdded = false;

					// For each point in line (points lying somewhere on path's geodesic) build a path
					for (let j = 0; j < perpLinePoints.length - 1; j++) {
						if (lineAfterPolygonAdded)
							break;

						let p1 = perpLinePoints[j], p2 = perpLinePoints[j + 1],
							line = this.perpendicularLine(p1, p2, this.Bx, "both"),
							linePoints = line.getActualLatLngs()[0],
							projectedLine = [];

						// Project perpendicular line. Also find indices of two closest points to the
						// current vertex.
						let indexP1, indexP2, lengthP1 = Infinity, lengthP2 = Infinity;
						for (let k = 0; k < linePoints.length - 1; k++) {
							let coord = linePoints[k],
								{x, y} = this.map.project(coord, 0);
							projectedLine.push([x, y]);

							if (j !== 0)
								continue;

							let length = this.getLineLengthMeters(L.polyline([p1, coord]));

							if (coord.lng < p1.lng && length < lengthP1) {
								lengthP1 = length;
								indexP1 = k;
							}

							if (coord.lng > p1.lng && length < lengthP2) {
								lengthP2 = length;
								indexP2 = k;
							}
						}

						let intersection = MathTools.clipLineByPolygon(projectedLine, projectedPolygon);

						if (!intersection) {
							// If it's the first point, and there's no intersection, use closest points as
							// an intersection with two bases in mind. This doesn't seem to happen, but let's be
							// cautious anyway
							if (j === 0) {
								intersection = [
									projectedLine[indexP1 - 2],
									projectedLine[indexP1 + 2]
								];
							} else {
								let [newP1, newP2] = currentPath[currentPath.length - 1].getLatLngs(),
									interP1 = this.map.project([p1.lat, newP1.lng], 0),
									interP2 = this.map.project([p1.lat, newP2.lng], 0);
								intersection = [[interP1.x, interP1.y], [interP2.x, interP2.y]];
								lineAfterPolygonAdded = true;
							}
						}

						let [pathP1, pathP2] = intersection,
							pathPoints = shouldSwapPoints ? [pathP2, pathP1] : [pathP1, pathP2];

						shouldSwapPoints = !shouldSwapPoints;

						let path = L.geodesic([
								this.map.unproject(pathPoints[0], 0),
								this.map.unproject(pathPoints[1], 0),
							], lineOptions),
							length = path.statistics.sphericalLengthMeters,
							numberOfImages = Math.ceil(length / this.Bx) + 4,
							extendBy = (this.Bx * numberOfImages - length) / 2 / length;
						path.changeLength("both", extendBy);

						currentPath.push(path);
						currentLength += path.statistics.sphericalLengthMeters;
						currentConnections.push(...path.getLatLngs());

						let capturePoints = L.geodesic(path.getLatLngs(), {segmentsNumber: numberOfImages}).getActualLatLngs()[0];
						for (let point of capturePoints)
							currentPoints.push(this.createCapturePoint(point, color));
					}

					if (currentLength >= minLength)
						continue;

					minLength = currentLength;
					shortestPath = currentPath;
					shortestPathConnections = currentConnections;
					shortestPathPoints = currentPoints;
				}
			}

			// Limit polygon size by limiting total approximate paths count. This is not 100% accurate but close enough.
			/*if (!shortestPath) {
				layersWereRemoved = true;
				this.polygonGroup.removeLayer(layer);
				return;
			}

			this.pathsGroup.addLayer(shortestPath);*/
			this.addPolygon(layer);

			this.internalConnections.addLayer(L.geodesic(shortestPathConnections, {
				...lineOptions, dashArray: this.dashedLine
			}));

			for (let path of shortestPath)
				this.pathGroup.addLayer(path);

			for (let marker of shortestPathPoints)
				this.pointsGroup.addLayer(marker);


		});
		this.updatePathsMeta();
		this.updateLayersVisibility();
		this.calculateParameters();
		return;

		if (layersWereRemoved)
			window.alert(L.ALS.locale.rectangleLayersRemoved);

		this.map.addLayer(this.labelsGroup); // Nothing in the base layer hides or shows it, so it's only hidden in code above
		this.updateLayersVisibility();
		this.calculateParameters();
		this.writeToHistory();
	},

	perpendicularLine: function (p1, p2, basis, extendFrom = "end", direction = 1) {
		// Project coordinates to the gnomonic projection and work with lines as with vectors.
		let proj = this.getProjFromWgs(p1.lng, p1.lat),
			[p2x, p2y] = proj.forward([p2.lng, p2.lat]),
			// Find an orthogonal vector
			perpX = 1000,
			perpY = -perpX * p2x / p2y,
			[perpLng, perpLat] = proj.inverse([perpX, perpY]);

		// Check if orthogonal vector in correct direction. If not, reverse it.
		if (Math.sign(perpLat - p1.lat) !== direction) {
			perpX = -perpX;
			perpY = -perpY;
			[perpLng, perpLat] = proj.inverse([perpX, perpY]);
		}

		// Build 175 degrees long geodesic
		// TODO: Make it be less than 180 after extending
		let targetLength = 175 / 180 * this.getEarthRadius(false),
			segmentsNumber = Math.ceil(targetLength / basis),
			geodesic = new L.Geodesic([p1, [perpLat, perpLng]], {segmentsNumber}),
			length = geodesic.statistics.sphericalLengthMeters,
			extendBy = (segmentsNumber * basis - length) / length;

		geodesic.changeLength(extendFrom, extendBy);
		return geodesic;
	},

	getProjFromWgs: function (lng0, lat0) {
		return proj4("+proj=longlat +ellps=sphere +no_defs", `+proj=gnom +lat_0=${lat0} +lon_0=${lng0} +x_0=0 +y_0=0 +ellps=sphere +datum=WGS84 +units=m +no_defs`);
	},

	statics: {
		wizard: L.ALS.SynthPolygonWizard,
		settings: new L.ALS.SynthPolygonSettings(),
	}
});