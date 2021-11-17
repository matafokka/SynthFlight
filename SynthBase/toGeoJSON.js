const MathTools = require("../MathTools.js");
const turfHelpers = require("@turf/helpers");
const geojsonMerge = require("@mapbox/geojson-merge"); // Using this since turfHelpers.featureCollection() discards previously defined properties.

L.ALS.SynthBaseLayer.prototype.toGeoJSON = function (path1Metadata, path2Metadata) {
	// We need to merge paths and connections into one line. The task is to find cycles.

	/*let pushLatLngs = (latLngs, pushTo, isPath = false) => {
		let toPush = [];
		for (let p of latLngs)
			toPush.push([p.lng, p.lat]);
		toPush.isPath = isPath;
		pushTo.push(toPush);
	}

	let airportPos = this._airportMarker.getLatLng(), airportPosArr = [airportPos.lng, airportPos.lat], cycles = [], pathNumber = 1;
	for (let path of this.paths) {
		let groups = [], connectionLayers = path.connectionsGroup.getLayers(), pathLayers = path.pathGroup.getLayers();

		// Copy connections. Connection to the airport contains 3 points which needs workaround. Also convert LatLng to array of lng-lat.
		for (let layer of connectionLayers) {
			if (layer === path.previouslyRemovedConnection)
				continue;

			let latLngs = layer.getLatLngs();
			if (latLngs.length === 2) {
				pushLatLngs(latLngs, groups);
				continue;
			}
			pushLatLngs([latLngs[0], latLngs[1]], groups);
			pushLatLngs([latLngs[1], latLngs[2]], groups);
		}

		// Do the same for the paths
		for (let layer of pathLayers)
			pushLatLngs(layer.getLatLngs(), groups, true);

		let groupsLength = groups.length, layers = {};

		for (let i = 0; i < groups.length; i++)
			layers[i] = groups[i];

		while (groupsLength > 0) {
			let cycle = [], startPoint, prevPoint;

			// Find starting line
			for (let i in layers) {
				let [p1, p2] = layers[i]; // It'll always be a connection, so we can pick just two points

				if (MathTools.arePointsEqual(p1, airportPosArr)) {
					startPoint = p1;
					prevPoint = p2;
				}
				else if (MathTools.arePointsEqual(p2, airportPosArr)) {
					startPoint = p2;
					prevPoint = p1;
				} else
					continue;

				delete layers[i];
				groupsLength--;
				cycle.push(startPoint, prevPoint);
				break;
			}

			// Keep finding and adding points to the cycle until we reach airport pos, i.e. until cycle closes
			let isFinal = false, needPath = true;
			while (!isFinal) {
				for (let i in layers) {
					let layer = layers[i], p1 = layer[0], p2 = layer[layer.length - 1], toAdd,
						start = -1, end = layer.length, addition = 1; // To add points later

					if ((needPath && !layer.isPath) || (!needPath && layer.isPath))
						continue;

					if (MathTools.arePointsEqual(p1, prevPoint))
						toAdd = p2;
					else if (MathTools.arePointsEqual(p2, prevPoint)) {
						toAdd = p1;
						start = end;
						end = -1;
						addition = -1;
					}
					else
						continue;

					needPath = !needPath;
					delete layers[i];
					cycle.pop();
					groupsLength--;
					prevPoint = toAdd;
					isFinal = MathTools.arePointsEqual(toAdd, airportPosArr);

					// Add other points from paths
					for (let j = start + addition; j !== end; j += addition)
						cycle.push(layer[j]);

					break;
				}
			}
			let cycleJson = turfHelpers.lineString(cycle), metadata = pathNumber === 1 ? path1Metadata : path2Metadata;
			for (let name in metadata)
				cycleJson.properties[name] = metadata[name];

			cycleJson.properties.length = this.lineLengthUsingFlightHeight(cycle);
			cycleJson.properties.flightTime = this.getFlightTime(cycleJson.properties.length);
			cycles.push(cycleJson);
		}
		pathNumber++;
	}*/

	this.hullToCycles(this.paths[1]);

	/*let isHull = this.getWidgetById("connectionMethod").getValue() === "allIntoOne";
	for (let path of this.paths) {
		if (isHull) {
			console.log(this.hullToCycles(path));
		} else {

		}
	}*/

	return geojsonMerge.merge(cycles);
}
