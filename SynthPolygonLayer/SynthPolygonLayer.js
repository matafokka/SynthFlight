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

		/**
		 * 60 degrees geodesic line length in meters
		 * @type {number}
		 */
		this.maxGeodesicLengthMeters = this.getEarthRadius() * 60;

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
			let center = layer.getBounds().getCenter(),
				proj = proj4("+proj=longlat +ellps=sphere +no_defs", `+proj=gnom +lat_0=${center.lat} +lon_0=${center.lng} +x_0=0 +y_0=0 +ellps=sphere +datum=WGS84 +units=m +no_defs`),
				latLngs = layer.getLatLngs()[0],
				{upper, lower} = this.getConvexHull(L.LatLngUtil.cloneLatLngs(latLngs)),
				projectedPolygon = [],
				minLength = Infinity, shortestPath, shortestPathConnections, shortestPathPoints;

			// Convert polygon coords to layer points, so we can use MathTools
			for (let coord of latLngs)
				projectedPolygon.push(proj.forward([coord.lng, coord.lat]));

			projectedPolygon.push(projectedPolygon[0]);

			// For upper part, perpendiculars should be headed downwards, for lower, upwards
			upper.direction = -1;
			lower.direction = 1;

			for (let part of [upper, lower]) {
				for (let i = 0; i < part.length - 1; i++) {
					// Get a directional line
					let origP1 = part[i], origP2 = part[i + 1],
						edgeP1 = proj.forward([origP1.lng, origP1.lat]), edgeP2 = proj.forward([origP2.lng, origP2.lat]),
						directionalLine = this.perpendicularLine(proj, edgeP1, edgeP2, "end", part.direction),
						currentPath = [], currentConnections = [], currentLength = 0, currentPoints = [],
						shouldSwapPoints = false, lineAfterPolygonAdded = false,
						length = MathTools.distanceBetweenPoints(...directionalLine);

					// Move along the line by By
					for (let deltaBy = 0; deltaBy < length; deltaBy += this.By) {
						if (lineAfterPolygonAdded)
							break;

						let p1 = this.scaleLine(directionalLine, deltaBy)[1],
							p2 = this.scaleLine(directionalLine, deltaBy + this.By)[1],
							line = this.perpendicularLine(proj, p1, p2, "both"),
							intersection = MathTools.clipLineByPolygon(line, projectedPolygon);

						if (!intersection) {
							// If it's the first point, use an edge as intersection
							if (deltaBy === 0)
								intersection = [edgeP1, edgeP2];
							else {
								// Move line along perpendicular. See details here: https://math.stackexchange.com/questions/2593627/i-have-a-line-i-want-to-move-the-line-a-certain-distance-away-parallelly
								let [p1, p2] = currentPath[currentPath.length - 1].getLatLngs(),
									[p1x, p1y] = proj.forward([p1.lng, p1.lat]),
									[p2x, p2y] = proj.forward([p2.lng, p2.lat]),
									dx = p2x - p1x, dy = p2y - p1y,
									dr = this.By / Math.sqrt(dx ** 2 + dy ** 2),
									xMod = dr * (p1y - p2y), yMod = dr * (p2x - p1x);

								if (Math.sign(yMod) !== part.direction) {
									xMod = -xMod;
									yMod = -yMod;
								}

								intersection = [
									[p1x + xMod, p1y + yMod],
									[p2x + xMod, p2y + yMod],
								];
								lineAfterPolygonAdded = true;
							}
						}

						if (shouldSwapPoints)
							intersection.reverse();

						shouldSwapPoints = !shouldSwapPoints;

						let path = L.geodesic([
								proj.inverse(intersection[0]).reverse(),
								proj.inverse(intersection[1]).reverse(),
							], {
							...lineOptions, color: lineAfterPolygonAdded ? "red" : "blue",
						}),
							length = path.statistics.sphericalLengthMeters,
							numberOfImages = Math.ceil(length / this.Bx), extendBy;

						// Don't extend copied line
						if (lineAfterPolygonAdded) {
							extendBy = 0;
						} else {
							numberOfImages += 4;
							extendBy = (this.Bx * numberOfImages - length) / 2 / length;
						}

						// If current length is already greater than previous, break loop and save some time
						let tempLength = currentLength + length + length * extendBy;
						if (tempLength >= minLength) {
							currentLength = tempLength;
							break;
						}

						if (!lineAfterPolygonAdded) {
							path.changeLength("both", extendBy);

							if (MathTools.isEqual(length, path.statistics.sphericalLengthMeters)) {
								// TODO: Do something about really short lines
							}
						}

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
			window.alert(L.ALS.locale.rectangleLayersSkipped);

		this.map.addLayer(this.labelsGroup); // Nothing in the base layer hides or shows it, so it's only hidden in code above
		this.updateLayersVisibility();
		this.calculateParameters();
		this.writeToHistory();
	},

	perpendicularLine: function (proj, p1, p2, extendFrom = "end", direction = 1) {
		// Project coordinates to the gnomonic projection and work with lines as with vectors.
		let [p1x, p1y] = p1, [p2x, p2y] = p2,
			x = p2x - p1x, y = p2y - p1y,
			// Find an orthogonal vector
			perpX = 1000,
			perpY = -perpX * x / y;

		// Check if orthogonal vector in correct direction. If not, reverse it.
		if (Math.sign(perpY) !== direction) {
			perpX = -perpX;
			perpY = -perpY;
		}

		// Move vector back
		perpX += p1x;
		perpY += p1y;

		// Scale line
		let line = this.scaleLine([[p1x, p1y], [perpX, perpY]], this.maxGeodesicLengthMeters);

		if (extendFrom !== "both")
			return line;

		return [this.perpendicularLine(proj, p1, p2, "end", -direction)[1], line[1]];
	},

	scaleLine: function (line, targetLength) {
		let [p1, p2] = line, [p1x, p1y] = p1, [p2x, p2y] = p2,
			dx = p2x - p1x, dy = p2y - p1y,
			lengthModifier = targetLength / Math.sqrt(dx ** 2 + dy ** 2);
		dx *= lengthModifier;
		dy *= lengthModifier;
		return [[p1x, p1y], [dx + p1x, dy + p1y]];
	},

	statics: {
		wizard: L.ALS.SynthPolygonWizard,
		settings: new L.ALS.SynthPolygonSettings(),
	}
});