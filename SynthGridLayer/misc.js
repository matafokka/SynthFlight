// Misc methods, event handlers, etc which most likely won't change in future

const turfHelpers = require("@turf/helpers");
const polybool = require("polybooljs");
const MathTools = require("../MathTools.js");

L.ALS.SynthGridLayer.prototype._setColor = function (widget) {
	this[widget.id] = widget.getValue();
	this.updateGrid();
}

L.ALS.SynthGridLayer.prototype.calculateParameters = function () {
	L.ALS.SynthBaseLayer.prototype.calculateParameters.call(this);

	// Calculate estimated paths count for a polygon. Values are somewhat true for equatorial regions.
	// We'll check if it's too small (in near-polar regions, there'll be only one path when value is 2) or too big.
	let latLngs = ["lat", "lng"];
	for (let name of latLngs) {
		let cellSize = Math.round(turfHelpers.radiansToLength(turfHelpers.degreesToRadians(this[name + "Distance"]), "meters"));
		this[name + "FakePathsCount"] = Math.ceil(cellSize / this.By);
	}

	this._calculatePolygonParameters();
}

L.ALS.SynthGridLayer.prototype._updateLayersVisibility = function () {
	let hidePathsByMeridians = this.getWidgetById("hidePathsByMeridians").getValue(),
		hidePathsByParallels = this.getWidgetById("hidePathsByParallels").getValue();

	if (this.getWidgetById("hidePathsConnections").getValue()) {
		this.parallelsInternalConnections.remove();
		this.parallelsExternalConnections.remove();
		this.meridiansInternalConnections.remove();
		this.meridiansExternalConnections.remove();
	} else {
		this._hideOrShowLayer(hidePathsByParallels, this.parallelsInternalConnections);
		this._hideOrShowLayer(hidePathsByParallels, this.parallelsExternalConnections);
		this._hideOrShowLayer(hidePathsByMeridians, this.meridiansInternalConnections);
		this._hideOrShowLayer(hidePathsByMeridians, this.meridiansExternalConnections);
	}

	if (this.getWidgetById("hideCapturePoints").getValue()) {
		this.latPointsGroup.remove();
		this.lngPointsGroup.remove();
	} else {
		this._hideOrShowLayer(hidePathsByParallels, this.lngPointsGroup);
		this._hideOrShowLayer(hidePathsByMeridians, this.latPointsGroup);
	}

	this._hideOrShowLayer(hidePathsByParallels, this.pathsByParallels);
	this._hideOrShowLayer(hidePathsByMeridians, this.pathsByMeridians);

	this._doHidePolygonWidgets = this.getWidgetById("hidePolygonWidgets").getValue();
	this._hideOrShowLayer(this._doHidePolygonWidgets || this._shouldHideEverything, this.widgetsGroup);
	this._doHidePathsNumbers = this.getWidgetById("hideNumbers").getValue();
	this._drawPaths(); // We have to redraw paths both for hiding one of the paths and hiding numbers
}

/**
 * Hides or shows layer.
 * @param hide {boolean} If true, hide layer
 * @param layer {Layer} Layer to show or hide
 * @return {boolean} If true, layer has been hidden. False otherwise.
 * @private
 */
L.ALS.SynthGridLayer.prototype._hideOrShowLayer = function (hide, layer) {
	if (hide)
		layer.remove();
	else
		this.map.addLayer(layer);
	return hide;
}

/**
 * Updates grid by redrawing all polygons, recalculating stuff, etc
 */
L.ALS.SynthGridLayer.prototype.updateGrid = function () {
	this._onMapZoom();
	this.calculateParameters();
}

/**
 * Generates polygon name for adding into this.selectedPolygons
 * @param polygon Polygon to generate name for
 * @return {string} Name for given polygon
 * @private
 */
L.ALS.SynthGridLayer.prototype._generatePolygonName = function (polygon) {
	let firstPoint = polygon.getLatLngs()[0][0];
	return "p_" + this.toFixed(firstPoint.lat) + "_" + this.toFixed(firstPoint.lng);
}

/**
 * Loops over pathsByParallels and pathsByMeridians and calls callback
 * @param callback {function(Polyline)} Callback function that accepts polyline (path)
 */
L.ALS.SynthGridLayer.prototype.forEachPath = function (callback) {
	let groups = ["pathsByParallels", "pathsByMeridians"];
	for (let group of groups)
		callback(this[group]);
}

L.ALS.SynthGridLayer.prototype.onHide = function () {
	this.forEachPath((path) => {
		path.remove();
	});
}

L.ALS.SynthGridLayer.prototype.onShow = function () {
	this.forEachPath((path) => {
		this.map.addLayer(path);
	});
	this.updateGrid(); // Update grid upon showing
}

L.ALS.SynthGridLayer.prototype.onDelete = function () {
	this.onHide();
}

/**
 * Truncates argument to fifth number after point.
 * @param n Number to truncate
 * @return {number} Truncated number
 */
L.ALS.SynthGridLayer.prototype.toFixed = function (n) {
	return parseFloat(n.toFixed(5));
}

L.ALS.SynthGridLayer.prototype._closestGreater = function (current, divider) {
	return Math.ceil(current / divider) * divider;
}

L.ALS.SynthGridLayer.prototype._closestLess = function (current, divider) {
	return Math.floor(current / divider) * divider;
}

L.ALS.SynthGridLayer.prototype.applyNewSettings = function (settings) {
	this.calculateThreshold(settings);
	this.updateGrid();
}

/**
 * Calculates grid hiding threshold
 * @param settings {SettingsObject} Settings to calculate threshold from
 */
L.ALS.SynthGridLayer.prototype.calculateThreshold = function (settings) {
	let multiplier = (settings.gridHidingFactor - 5) / 5; // Factor is in range [1..10]. Let's make it [-1...1]
	this.minThreshold = 15 + 10 * multiplier;
	this.maxThreshold = 60 + 60 * multiplier;

	// If grid will have labels, on lower zoom levels map will become both messy and unusably slow. So we have to set higher hiding threshold.
	this.hidingThreshold = this._currentStandardScale === Infinity ? this.minThreshold : this.maxThreshold;
}

/**
 * Merges selected polygon into one GeoJSON feature.
 * @return number[][][] Merged feature
 * @private
 */
L.ALS.SynthGridLayer.prototype._mergeSelectedPolygons = function () {
	// Convert object with polygons to an array and push edges instead of points here
	this.mergedPolygons = [];
	for (let id in this.selectedPolygons) {
		let latLngs = this.selectedPolygons[id].getLatLngs()[0], poly = [];
		for (let p of latLngs)
			poly.push([p.lng, p.lat]);
		poly.push(poly[0]); // We need to close the polygons to use MathTools stuff
		poly.zoneNumber = this.selectedPolygonsWidgets[id].getWidgetById("zoneNumber").getValue();
		poly.name = this.selectedPolygons[id].polygonName; // TODO: Remove after testing
		this.mergedPolygons.push(poly);
	}

	// Until there's no adjacent polygons, compare each polygon to each and try to find adjacent one. Then merge it.
	while (true) {
		let toMerge;
		for (let poly1 of this.mergedPolygons) {
			for (let poly2 of this.mergedPolygons) {
				if (poly1 === poly2 || poly1.zoneNumber !== poly2.zoneNumber)
					continue;

				// Check if we have a small polygon completely inside of a big one, i.e., if it could form a hole.
				// We need a special algorithm because a small polygon might have all common points, but not any common
				// edges. In such case, polygons shouldn't be merged.
				// If all points touch edges, but not all edges do the same, we're completely fine with it.

				// So we're gonna check if all points of a small polygon are inside a big one, but none of the points
				// touches a point of a big polygon.

				let shouldMerge = true;
				for (let p1 of poly1) {
					shouldMerge = shouldMerge && MathTools.isPointInPolygon(p1, poly2);

					if (!shouldMerge)
						break;

					for (let p2 of poly2) {
						shouldMerge = shouldMerge && !MathTools.arePointsEqual(p1, p2);

						if (!shouldMerge)
							break;
					}

					if (!shouldMerge)
						break;
				}

				if (shouldMerge) {
					toMerge = {poly1, poly2};
					break;
				}

				// Check if any two edges of the polygons overlap, in which case we should merge polygons

				for (let ii = 0; ii < poly1.length - 1; ii++) {
					let edge1 = [poly1[ii], poly1[ii + 1]];

					for (let jj = 0; jj < poly2.length - 1; jj++) {
						let edge2 = [poly2[jj], poly2[jj + 1]],
							intersection = MathTools.linesIntersection(edge1, edge2);

						if (!intersection || intersection.length === 1)
							continue;

						let [p1, p2] = intersection, pairs = [[p1, p2], [p2, p1]];

						// When edges are adjacent, i.e. when only one point of the first edge touches a point
						// of the second edge
						if (MathTools.arePointsEqual(p1, p2))
							continue;

						for (let pair of pairs) {
							let [p1, p2] = pair;
							if (MathTools.isPointOnLine(p1, edge1) && MathTools.isPointOnLine(p2, edge2)) {
								toMerge = {poly1, poly2};
								break;
							}
						}

						if (toMerge)
							break;
					}
					if (toMerge)
						break;
				}
				if (toMerge)
					break;
			}
			if (toMerge)
				break;
		}
		if (!toMerge)
			break;

		let merged = polybool.union(
			{regions: [toMerge.poly1]},
			{regions: [toMerge.poly2]}
		).regions,
			newPolygon = merged.length === 1 ? merged[0] : merged[1];
		newPolygon.zoneNumber = toMerge.poly1.zoneNumber;

		// Union returns polygon with four points, we need to close it
		if (!MathTools.arePointsEqual(newPolygon[0], newPolygon[newPolygon.length - 1]))
			newPolygon.push(newPolygon[0]);

		let newPolygons = [newPolygon]; // Array with merged polygons

		for (let poly of this.mergedPolygons) {
			if (poly !== toMerge.poly1 && poly !== toMerge.poly2)
				newPolygons.push(poly);
		}
		this.mergedPolygons = newPolygons;
	}

	return this.mergedPolygons;
}