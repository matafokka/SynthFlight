// Misc methods, event handlers, etc which most likely won't change in future

const turfHelpers = require("@turf/helpers");

L.ALS.SynthPolygonLayer.prototype._setColor = function (widget) {
	this[widget.id] = widget.getValue();
	this.updateAll();
}

L.ALS.SynthPolygonLayer.prototype.calculateParameters = function () {
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

L.ALS.SynthPolygonLayer.prototype._updateLayersVisibility = function () {
	let hidePathsByMeridians = this.getWidgetById("hidePathsByMeridians").getValue(),
		hidePathsByParallels = this.getWidgetById("hidePathsByParallels").getValue();

	if (this.getWidgetById("hidePathsConnections").getValue()) {
		this.parallelsInternalConnections.remove();
		this.parallelsExternalConnections.remove();
		this.meridiansInternalConnections.remove();
		this.meridiansExternalConnections.remove();
	} else {
		this.hideOrShowLayer(hidePathsByParallels, this.parallelsInternalConnections);
		this.hideOrShowLayer(hidePathsByParallels, this.parallelsExternalConnections);
		this.hideOrShowLayer(hidePathsByMeridians, this.meridiansInternalConnections);
		this.hideOrShowLayer(hidePathsByMeridians, this.meridiansExternalConnections);
	}

	if (this.getWidgetById("hideCapturePoints").getValue()) {
		this.latPointsGroup.remove();
		this.lngPointsGroup.remove();
	} else {
		this.hideOrShowLayer(hidePathsByParallels, this.lngPointsGroup);
		this.hideOrShowLayer(hidePathsByMeridians, this.latPointsGroup);
	}

	this.hideOrShowLayer(hidePathsByParallels, this.pathsByParallels);
	this.hideOrShowLayer(hidePathsByMeridians, this.pathsByMeridians);

	this._doHidePolygonWidgets = this.getWidgetById("hidePolygonWidgets").getValue();
	this.hideOrShowLayer(this._doHidePolygonWidgets || this._shouldHideEverything, this.widgetsGroup);
	this._doHidePathsNumbers = this.getWidgetById("hideNumbers").getValue();
	this._drawPaths(); // We have to redraw paths both for hiding one of the paths and hiding numbers
}

/**
 * Hides or shows layer.
 * @param hide {boolean} If true, hide layer
 * @param layer {Layer} Layer to show or hide
 * @return {boolean} If true, layer has been hidden. False otherwise.
 */
L.ALS.SynthPolygonLayer.prototype.hideOrShowLayer = function (hide, layer) {
	if (hide)
		layer.remove();
	else
		this.map.addLayer(layer);
	return hide;
}

/**
 * Updates grid by redrawing all polygons, recalculating stuff, etc
 */
L.ALS.SynthPolygonLayer.prototype.updateAll = function () {
	// Legacy code, though, this might be used for something else later
	this.calculateParameters();
}

/**
 * Generates polygon name for adding into this.polygons
 * @param polygon Polygon to generate name for
 * @return {string} Name for given polygon
 * @private
 */
L.ALS.SynthPolygonLayer.prototype._generatePolygonName = function (polygon) {
	let firstPoint = polygon.getLatLngs()[0][0];
	return "p_" + this.toFixed(firstPoint.lat) + "_" + this.toFixed(firstPoint.lng);
}

/**
 * Loops over pathsByParallels and pathsByMeridians and calls callback
 * @param callback {function(Polyline)} Callback function that accepts polyline (path)
 */
L.ALS.SynthPolygonLayer.prototype.forEachPath = function (callback) {
	let groups = ["pathsByParallels", "pathsByMeridians"];
	for (let group of groups)
		callback(this[group]);
}

L.ALS.SynthPolygonLayer.prototype.onHide = function () {
	this.forEachPath((path) => {
		path.remove();
	});
}

L.ALS.SynthPolygonLayer.prototype.onShow = function () {
	this.forEachPath((path) => {
		this.map.addLayer(path);
	});
	this.updateAll(); // Update grid upon showing
}

L.ALS.SynthPolygonLayer.prototype.onDelete = function () {
	this.onHide();
}

/**
 * Truncates argument to fifth number after point.
 * @param n Number to truncate
 * @return {number} Truncated number
 */
L.ALS.SynthPolygonLayer.prototype.toFixed = function (n) {
	return parseFloat(n.toFixed(5));
}

L.ALS.SynthPolygonLayer.prototype._closestGreater = function (current, divider) {
	return Math.ceil(current / divider) * divider;
}

L.ALS.SynthPolygonLayer.prototype._closestLess = function (current, divider) {
	return Math.floor(current / divider) * divider;
}

L.ALS.SynthPolygonLayer.prototype.applyNewSettings = function (settings) {
	this.calculateThreshold(settings);
	this.updateAll();
}

/**
 * Calculates grid hiding threshold
 * @param settings {SettingsObject} Settings to calculate threshold from
 */
L.ALS.SynthPolygonLayer.prototype.calculateThreshold = function (settings) {
	let multiplier = (settings.gridHidingFactor - 5) / 5; // Factor is in range [1..10]. Let's make it [-1...1]
	this.minThreshold = 15 + 10 * multiplier;
	this.maxThreshold = 60 + 60 * multiplier;

	// If grid will have labels, on lower zoom levels map will become both messy and unusably slow. So we have to set higher hiding threshold.
	this.hidingThreshold = this._currentStandardScale === Infinity ? this.minThreshold : this.maxThreshold;
}

/**
 * Merges selected polygon into one GeoJSON feature.
 * @return number[][][] Merged feature
 */
L.ALS.SynthPolygonLayer.prototype.mergePolygons = function () {
	// Convert object with polygons to an array and push edges instead of points here
	this.mergedPolygons = [];
	for (let id in this.polygons) {
		let latLngs = this.polygons[id].getLatLngs()[0], poly = [];
		for (let p of latLngs)
			poly.push([p.lng, p.lat]);
		poly.push(poly[0]); // We need to close the polygons to use MathTools stuff
		if (this.useZoneNumbers)
			poly.zoneNumber = this.polygonsWidgets[id].getWidgetById("zoneNumber").getValue();
		this.mergedPolygons.push(poly);
	}
}