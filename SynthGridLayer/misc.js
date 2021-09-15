// Misc methods, event handlers, etc which most likely won't change in future

const turfHelpers = require("@turf/helpers");
const union = require("@turf/union").default;

L.ALS.SynthGridLayer.prototype.onMarkerDrag = function () {
	L.ALS.SynthBaseLayer.prototype.onMarkerDrag.call(this);
	this._drawPaths();
}

L.ALS.SynthGridLayer.prototype._setColor = function (widget) {
	this[widget.id] = widget.getValue();
	this.updateGrid();
}

L.ALS.SynthGridLayer.prototype._setLineThickness = function (widget) {
	this.lineThicknessValue = widget.getValue();
	this.updateGrid();
}

L.ALS.SynthGridLayer.prototype._hidePathsConnections = function (widget) {
	this._doHidePathsConnections = widget.getValue();
	this._drawPaths();
}

/**
 * Updates grid by redrawing all polygons, recalculating stuff, etc
 */
L.ALS.SynthGridLayer.prototype.updateGrid = function () {
	this.labelsGroup.deleteAllLabels();
	this._onMapZoom();
	this.calculateParameters();
	this._calculatePolygonParameters();
	this._drawPaths();
}

L.ALS.SynthGridLayer.prototype._hidePolygonWidgets = function (widget) {
	this._doHidePolygonWidgets = this._hideOrShowLayer(widget, this.widgetsGroup);
}

L.ALS.SynthGridLayer.prototype._hidePointsNumbers = function (widget) {
	this._doHidePathsNumbers = widget.getValue();
	this.updateGrid();
}

L.ALS.SynthGridLayer.prototype._hideCapturePoints = function (widget) {
	this._areCapturePointsHidden = this._hideOrShowLayer(widget, this.latPointsGroup);
	this._hideOrShowLayer(widget, this.lngPointsGroup);
	this._hidePathsByMeridians(this.getWidgetById("hidePathsByMeridians"));
	this._hidePathsByParallels(this.getWidgetById("hidePathsByParallels"));
}

L.ALS.SynthGridLayer.prototype._hidePathsByMeridians = function (widget) {
	this._doHidePathsByMeridians = this._hideOrShowLayer(widget, this["pathsByMeridians"]);
	if (!this._areCapturePointsHidden)
		this._hideOrShowLayer(widget, this.latPointsGroup);
	this.updateGrid();
}

L.ALS.SynthGridLayer.prototype._hidePathsByParallels = function (widget) {
	this._doHidePathsByParallels = this._hideOrShowLayer(widget, this["pathsByParallels"]);
	if (!this._areCapturePointsHidden)
		this._hideOrShowLayer(widget, this.lngPointsGroup);
	this.updateGrid();
}

/**
 * Hides or shows layer.
 * @param checkbox {L.ALS.Widgets.Checkbox} Checkbox that indicates whether layer should be hidden or not
 * @param layer {Layer} Layer to show or hide
 * @return {boolean} If true, layer has been hidden. False otherwise.
 * @private
 */
L.ALS.SynthGridLayer.prototype._hideOrShowLayer = function (checkbox, layer) {
	let isChecked = checkbox.getValue();
	if (isChecked)
		layer.remove();
	else
		this.map.addLayer(layer);
	return isChecked;
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

L.ALS.SynthGridLayer.prototype.setAirportLatLng = function () {
	L.ALS.SynthBaseLayer.prototype.setAirportLatLng.call(this);
	this._drawPaths();
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
 * @param settings {L.ALS.Settings} Settings to calculate threshold from
 */
L.ALS.SynthGridLayer.prototype.calculateThreshold = function (settings) {
	let multiplier = (settings.gridHidingFactor - 5) / 5; // Factor is in range [1..10]. Let's make it [-1...1]
	this.minThreshold = 15 + 10 * multiplier;
	this.maxThreshold = 60 + 60 * multiplier;

	// If grid will have labels, on lower zoom levels map will become both messy and unusably slow. So we have to set higher hiding threshold.
	this.hidingThreshold = this._currentStandardScale === Infinity ? this.minThreshold : this.maxThreshold;
}

/**
 * Calculates line length using haversine formula with account of flight height
 * @param line
 * @return {number}
 */
L.ALS.SynthGridLayer.prototype.lineLengthUsingFlightHeight = function (line) {
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
}

/**
 * Merges selected polygon into one GeoJSON feature.
 * @param currentGeoJSON Current GeoJSON object
 * @param name {string} Name of current polygon
 * @return Merged feature
 * @private
 */
L.ALS.SynthGridLayer.prototype._addSelectedPolygonToGeoJSON = function (currentGeoJSON, name) {
	let polygonGeoJSON = this.selectedPolygons[name].toGeoJSON();
	if (currentGeoJSON === undefined) {
		currentGeoJSON = polygonGeoJSON;
		return currentGeoJSON;
	}
	currentGeoJSON = union(currentGeoJSON, polygonGeoJSON);
	return currentGeoJSON;
}