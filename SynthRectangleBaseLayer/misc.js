// Misc methods, event handlers, etc which most likely won't change in future

const turfHelpers = require("@turf/helpers");

L.ALS.SynthRectangleBaseLayer.prototype.calculateParameters = function () {
	L.ALS.SynthBaseLayer.prototype.calculateParameters.call(this);

	// Calculate estimated paths count for a polygon. Values are somewhat true for equatorial regions.
	// We'll check if it's too small (in near-polar regions, there'll be only one path when value is 2) or too big.
	let latLngs = ["lat", "lng"];
	for (let name of latLngs) {
		let cellSize = Math.round(turfHelpers.radiansToLength(turfHelpers.degreesToRadians(this[name + "Distance"]), "meters"));
		this[name + "FakePathsCount"] = Math.ceil(cellSize / this.By);
	}

	this.calculatePolygonParameters();
}

L.ALS.SynthRectangleBaseLayer.prototype.updateLayersVisibility = function () {
	L.ALS.SynthPolygonBaseLayer.prototype.updateLayersVisibility.call(this);
	this._drawPaths(); // We have to redraw paths both for hiding one of the paths and hiding numbers
}

L.ALS.SynthRectangleBaseLayer.prototype._closestGreater = function (current, divider) {
	return Math.ceil(current / divider) * divider;
}

L.ALS.SynthRectangleBaseLayer.prototype._closestLess = function (current, divider) {
	return Math.floor(current / divider) * divider;
}

L.ALS.SynthRectangleBaseLayer.prototype.calculatePolygonParameters = function (widget) {
	L.ALS.SynthPolygonBaseLayer.prototype.calculatePolygonParameters.call(this, widget);

	// Draw thick borders around selected polygons
	this.mergePolygons();
	this.bordersGroup.clearLayers();
	if (this.mergedPolygons.length === 0) {
		this.clearPaths();
		return;
	}

	for (let polygon of this.mergedPolygons) {
		let latLngs = [];
		for (let p of polygon)
			latLngs.push([p[1], p[0]]);

		if (!this.useZoneNumbers)
			continue;

		this.bordersGroup.addLayer(L.polyline(latLngs, {
				weight: this.lineThicknessValue * this.bordersGroup.thicknessMultiplier,
				color: this.getWidgetById("borderColor").getValue()
			}
		));
	}
	this._drawPaths();

	this.writeToHistoryDebounced();
}

/**
 * Merges selected polygon into one GeoJSON feature.
 * @return {number[][][]} Merged feature
 */
L.ALS.SynthRectangleBaseLayer.prototype.mergePolygons = function () {
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