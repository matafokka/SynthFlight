const geojsonMerge = require("@mapbox/geojson-merge"); // Using this since turfHelpers.featureCollection() discards previously defined properties.

L.ALS.SynthRectangleBaseLayer.prototype.toGeoJSON = function () {
	let jsons = this.baseFeaturesToGeoJSON();

	if (this.pathsByMeridians.getLayers().length === 0 || this.pathsByParallels.getLayers().length === 0) {
		window.alert(`${L.ALS.locale.jsonNoPaths1} "${this.getName()}"! ${L.ALS.locale.jsonNoPaths2}`);
		return geojsonMerge.merge(jsons);
	}

	// See _calculateParameters
	let parallelsProps = {name: "Flight paths by parallels"}, meridiansProps = {name: "Flight paths by meridians"};

	for (let prop of [parallelsProps, meridiansProps]) {
		for (let param of this.propertiesToExport)
			prop[param] = this[param];
	}

	jsons.push(L.ALS.SynthBaseLayer.prototype.toGeoJSON.call(this, parallelsProps, meridiansProps));

	let pointsParams = [["capturePointsByMeridians", this.latPointsGroup], ["capturePointsByParallels", this.lngPointsGroup]];
	for (let param of pointsParams) {
		param[1].eachLayer((layer) => {
			let pointsJson = layer.toGeoJSON();
			pointsJson.name = param[0];
			jsons.push(pointsJson);
		});
	}

	return geojsonMerge.merge(jsons);
}