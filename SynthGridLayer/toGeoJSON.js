const geojsonMerge = require("@mapbox/geojson-merge"); // Using this since turfHelpers.featureCollection() discards previously defined properties.

L.ALS.SynthGridLayer.prototype.toGeoJSON = function () {
	let jsons = [];

	for (let name in this.selectedPolygons) {
		if (!this.selectedPolygons.hasOwnProperty(name))
			continue;
		let polygon = this.selectedPolygons[name],
			polygonJson = polygon.toGeoJSON(),
			props = ["polygonName", "minHeight", "maxHeight", "meanHeight", "absoluteHeight", "reliefType", "elevationDifference"];
		for (let prop of props)
			polygonJson.properties[prop] = polygon[prop];
		polygonJson.properties.name = "Selected cell";
		jsons.push(polygonJson);
	}

	let airport = this._airportMarker.toGeoJSON();
	airport.name = "Airport";
	jsons.push(airport);

	if (this.pathsByMeridians.getLayers().length === 0 || this.pathsByParallels.getLayers().length === 0) {
		window.alert(`No paths has been drawn in layer "${this.getName()}"! You'll get only selected gird cells and airport position.`);
		return geojsonMerge.merge(jsons);
	}

	// See _calculateParameters
	let parallelsProps = {
			pathsCount: this.latPathsCount,
			name: "Flight paths by parallels"
		},
		meridiansProps = {
			pathsCount: this.lngPathsCount,
			name: "Flight paths by meridians"
		},
		params = ["cameraWidth", "cameraHeight", "pixelWidth", "focalLength", "flightHeight", "overlayBetweenPaths", "overlayBetweenImages", "imageScale", "ly", "Ly", "By", "lx", "Lx", "Bx", "GSI", "IFOV", "GIFOV", "FOV", "GFOV", "latCellSizeInMeters", "lngCellSizeInMeters", "selectedArea"];

	for (let prop of [parallelsProps, meridiansProps]) {
		for (let param of params)
			prop[param] = this[param];
	}

	jsons.push(L.ALS.SynthBaseLayer.prototype.toGeoJSON.call(this, parallelsProps, meridiansProps));

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