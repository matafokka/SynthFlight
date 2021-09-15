const geojsonMerge = require("@mapbox/geojson-merge"); // Using this since turfHelpers.featureCollection() discards previously defined properties.

L.ALS.SynthGridLayer.prototype.toGeoJSON = function () {
	let jsons = [];
	for (let name in this.selectedPolygons) {
		if (!this.selectedPolygons.hasOwnProperty(name))
			continue;
		let polygon = this.selectedPolygons[name];
		let polygonJson = polygon.toGeoJSON();
		let props = ["polygonName", "minHeight", "maxHeight", "meanHeight", "absoluteHeight", "reliefType", "elevationDifference"];
		for (let prop of props)
			polygonJson.properties[prop] = polygon[prop];
		polygonJson.properties.name = "Selected cell";
		jsons.push(polygonJson);
	}

	let airport = this._airportMarker.toGeoJSON();
	airport.name = "Airport";
	jsons.push(airport);

	if (this["pathsByMeridians"].isEmpty() || this["pathsByParallels"].isEmpty()) {
		window.alert(`No paths has been drawn in layer \"${this.getName()}\"! You'll get only selected gird cells and airport position.`);
		return geojsonMerge.merge(jsons);
	}

	let meridianJson = this["pathsByMeridians"].toGeoJSON();
	meridianJson.properties.name = "Flight paths by meridians";
	let parallelsJson = this["pathsByParallels"].toGeoJSON();
	parallelsJson.properties.name = "Flight paths by parallels";

	// See _calculateParameters
	let params = ["cameraWidth", "cameraHeight", "pixelWidth", "focalLength", "flightHeight", "overlayBetweenPaths", "overlayBetweenImages", "imageScale", "ly", "Ly", "By", "lx", "Lx", "Bx", "GSI", "IFOV", "GIFOV", "FOV", "GFOV", "latCellSizeInMeters", "lngCellSizeInMeters", "selectedArea"];
	for (let line of [meridianJson, parallelsJson]) {
		for (let param of params)
			line.properties[param] = this[param];
		jsons.push(line)
	}

	let lines = [
		["pathsByParallels", parallelsJson],
		["pathsByMeridians", meridianJson]
	];
	let lineParams = ["pathLength", "flightTime", "pathsCount"];
	for (let line of lines) {
		for (let param of lineParams)
			line[1].properties[param] = this[line[0]][param];
	}

	let pointsParams = [["capturePointByMeridians", this.latPointsGroup.getLayers()], ["capturePointByParallels", this.lngPointsGroup.getLayers()]];
	for (let param of pointsParams) {
		for (let layer of param[1]) {
			let pointsJson = layer.toGeoJSON();
			pointsJson.name = param[0];
			jsons.push(pointsJson);
		}
	}

	return geojsonMerge.merge(jsons);
}