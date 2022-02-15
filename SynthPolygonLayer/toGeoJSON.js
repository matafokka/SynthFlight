const geojsonMerge = require("@mapbox/geojson-merge"); // Using this since turfHelpers.featureCollection() discards previously defined properties.

L.ALS.SynthPolygonLayer.prototype.toGeoJSON = function () {
	let jsons = [];

	for (let name in this.polygons) {
		if (!this.polygons.hasOwnProperty(name))
			continue;
		let polygon = this.polygons[name],
			polygonJson = polygon.toGeoJSON(),
			props = ["polygonName", "minHeight", "maxHeight", "meanHeight", "absoluteHeight", "reliefType", "elevationDifference", "latCellSizeInMeters", "lngCellSizeInMeters"];
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
	let parallelsProps = {name: "Flight paths by parallels"}, meridiansProps = {name: "Flight paths by meridians"};

	for (let prop of [parallelsProps, meridiansProps]) {
		for (let param of this.propertiesToExport)
			prop[param] = this[param];
	}

	jsons.push(L.ALS.SynthBaseLayer.prototype.toGeoJSON.call(this, parallelsProps, meridiansProps));

	let pointsParams = [["capturePointsByMeridians", this.latPointsGroup.getLayers()], ["capturePointsByParallels", this.lngPointsGroup.getLayers()]];
	for (let param of pointsParams) {
		for (let layer of param[1]) {
			let pointsJson = layer.toGeoJSON();
			pointsJson.name = param[0];
			jsons.push(pointsJson);
		}
	}

	return geojsonMerge.merge(jsons);
}