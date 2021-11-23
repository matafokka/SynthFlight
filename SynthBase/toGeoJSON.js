const MathTools = require("../MathTools.js");
const turfHelpers = require("@turf/helpers");
const geojsonMerge = require("@mapbox/geojson-merge"); // Using this since turfHelpers.featureCollection() discards previously defined properties.

/**
 * Exports paths to GeoJSON. Should be overridden by child classes.
 * @param path1Metadata {Object} Metadata for path 1. Will be copied to route in this path.
 * @param path2Metadata {Object} Metadata for path 2. Will be copied to route in this path. Leave it as undefined if your layer has only one path.
 * @return {Object} GeoJSON with both paths.
 */
L.ALS.SynthBaseLayer.prototype.toGeoJSON = function (path1Metadata, path2Metadata = undefined) {
	let fn = this.getWidgetById("connectionMethod").getValue() === "allIntoOne" ? "hullToCycles" : "onePerFlightToCycles",
		pathNumber = 1, toMerge = [];

	for (let path of this.paths) {
		let cycles = this[fn](path), metadata = pathNumber === 1 ? path1Metadata : path2Metadata;

		for (let cycle of cycles) {

			let lngLats = [];
			for (let p of cycle)
				lngLats.push([p.lng, p.lat]);

			let cycleJson = turfHelpers.lineString(lngLats);
			for (let name in metadata)
				cycleJson.properties[name] = metadata[name];

			cycleJson.properties.length = this.getLineLengthMeters(cycle);
			cycleJson.properties.flightTime = this.getFlightTime(cycleJson.properties.length, false);

			toMerge.push(cycleJson);
		}
		pathNumber++;
	}

	return geojsonMerge.merge(toMerge);
}
