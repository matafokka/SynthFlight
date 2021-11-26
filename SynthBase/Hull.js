const MathTools = require("../MathTools.js");

// Actual paths are fixed and thus can't be optimized, so we should care only about their endpoints.
// We'll call them paths for the rest of this program. We have to connect line segments in shortest way.

// This problem is similar to TSP and VRP. VRP is subset of TSP, much harder to solve and might not even work.
// Trust me, I tried Clarke-Wright algorithm and it didn't work (looks like it leaves points for other routes).
// So we'll go with TSP. Convex hull algorithm fits well to our problem and is easy to modify for our needs.

// Hull will miss some of the endpoints, so for now the only modifications are connecting the missing point
// and adjusting connections between paths to get the shortest hull. I'll explain how we'll do it later.

// Sources:
// TSP algorithms overview: http://160592857366.free.fr/joe/ebooks/ShareData/Heuristics%20for%20the%20Traveling%20Salesman%20Problem%20By%20Christian%20Nillson.pdf
// Monotone chain implementation: https://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Convex_hull/Monotone_chain#JavaScript

/**
 * Connects paths using Convex Hull method, i.e. merges all paths into one
 * @param path Path to connect
 * @param color {string} Line color
 */
L.ALS.SynthBaseLayer.prototype.buildHull = function (path, color) {
	const {pathGroup, connectionsGroup, hullConnection} = path,
		points = [], layers = pathGroup.getLayers(),
		lineOptions = this.getConnectionLineOptions(color);

	connectionsGroup.clearLayers();

	if (layers.length === 0)
		return;

	if (layers.length === 1) {
		const path = layers[0].getLatLngs();
		connectionsGroup.addLayer(L.polyline(
			[path[0], path[path.length - 1]],
			lineOptions
		));
		connectionsGroup.addLayer(hullConnection);
		return;
	}

	// Get points from each path and mark them as belonged to a current path
	let paths = {}, pathsCount = layers.length; // Keep paths for merging
	for (let path of layers) {
		const layer = path.getLatLngs(), endPoints = [layer[0], layer[layer.length - 1]];

		endPoints.connectionId = L.ALS.Helpers.generateID();
		paths[endPoints.connectionId] = endPoints;

		for (let p of endPoints) {
			p.path = endPoints;
			p.actualLayer = layer;
			points.push(p);
		}
	}

	let {lower, upper} = this.getConvexHull(points);

	// Normalize path-connection order by appending other point of the first path, if it's not connected already.
	let [p1, p2] = lower;
	if (!p2)
		p2 = upper[0];
	if (p1.path !== p2.path) {
		for (let p of p1.path) {
			if (p !== p1) {
				p2 = p;
				break;
			}
		}
		lower = [p2, ...lower];
	}

	// Integrate missing end points of the paths into the hull and leave only connections.
	// This points won't produce optimal path, but we'll fix it later.
	let connections = [], passedPoints = {}, isFirstPoint = true;
	for (let hull of [lower, upper]) {
		for (let point of hull) {
			if (isFirstPoint) {
				isFirstPoint = false;
				point.id = L.ALS.Helpers.generateID();
				connections.push(point);
				passedPoints[point.id] = true;
				continue;
			}

			for (let p of point.path) {
				if (!p.id)
					p.id = L.ALS.Helpers.generateID();

				if (passedPoints[p.id])
					continue;

				passedPoints[p.id] = true;
				connections.push(p);

				// Remove point's path from the list because it'll be already connected
				if (paths[p.path.connectionId]) {
					delete paths[p.path.connectionId];
					pathsCount--;
				}
			}
		}
	}

	connections.push(connections[0]); // Connect endpoints of the hull

	// Optimize hull by rotating each path by 360 and checking if connections length has shortened
	// Paths are always even, if counting from 0.
	let optConnections = []; // We'll keep only optimal connections here and skip paths
	for (let i = 2; i < connections.length - 1; i += 2) {
		let pathP1 = connections[i], pathP2 = connections[i + 1],
			prevPair = optConnections.pop(), // This won't exist for the first path
			prevPoint = prevPair ? prevPair[0] : connections[i - 1], nextPoint = connections[i + 2];

		optConnections.push(...this.getHullOptimalConnection(pathP1, pathP2, prevPoint, nextPoint));
	}

	// We haven't rotated the first path, so do it
	let [toLast, toFirst] = this.getHullOptimalConnection(p1, p2, optConnections.pop()[0], optConnections[0][1]);
	optConnections[0][0] = toFirst[0];
	optConnections.push(toLast);

	// Second path was built using unoptimized first line, so we have to rotate second line again.
	let toSecond = optConnections[0], fromSecond = optConnections[1];
	let [optToSecond, optFromSecond] = this.getHullOptimalConnection(toSecond[1], fromSecond[0], toSecond[0], fromSecond[1]);
	optConnections[0] = optToSecond;
	optConnections[1] = optFromSecond;

	// Merge other paths with the hull by finding cheapest insertion and using it until no paths left
	while (pathsCount > 0) {
		let minLen = Infinity, insertion, insertAt, pathId;
		for (let id in paths) {
			if (!paths.hasOwnProperty(id))
				continue;

			let [p1, p2] = paths[id], pairs = [
				[p1, p2],
				[p2, p1]
			];

			for (let i = 0; i < optConnections.length; i++) {
				let [conP1, conP2] = optConnections[i];

				for (let pair of pairs) {
					let [p1, p2] = pair, line1 = [p1, conP1], line2 = [p2, conP2],
						len = this.getLineLengthMeters(line1) + this.getLineLengthMeters(line2);

					if (len < minLen) {
						minLen = len;
						insertion = [line1, line2];
						insertAt = i;
						pathId = id;
					}
				}
			}
		}
		optConnections = optConnections.slice(0, insertAt).concat(insertion, optConnections.slice(insertAt + 1, optConnections.length));
		delete paths[pathId];
		pathsCount--;
	}

	for (let pair of optConnections)
		connectionsGroup.addLayer(L.polyline(pair, lineOptions));
	connectionsGroup.addLayer(hullConnection);
	path.hullConnections = optConnections;
}

/**
 * Builds a convex hull around array of points
 * @param points {L.LatLng[]} Array of points
 * @return {{upper: L.LatLng[], lower: L.LatLng[]}} Convex hull of given points
 */
L.ALS.SynthBaseLayer.prototype.getConvexHull = function (points) {
	// Find convex hull of the points using monotone chain.
	points.sort((a, b) => {
		return a.lng === b.lng ? a.lat - b.lat : a.lng - b.lng;
	});

	let lower = [];
	for (let point of points) {
		while (lower.length >= 2 && this.cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0)
			lower.pop();
		lower.push(point);
	}

	let upper = [];
	for (let i = points.length - 1; i >= 0; i--) {
		const point = points[i];
		while (upper.length >= 2 && this.cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0)
			upper.pop();
		upper.push(point);
	}

	lower.pop();
	upper.pop();
	return {upper, lower}
}

/**
 * Rotates a path in hull and returns a pair of optimal connections
 * @param pathP1 {L.LatLng|number[]} First point of path
 * @param pathP2 {L.LatLng|number[]} Second point of path
 * @param prevPoint {L.LatLng|number[]} Previous point
 * @param nextPoint {L.LatLng|number[]} Next point
 * @return A pair of optimal connections
 */
L.ALS.SynthBaseLayer.prototype.getHullOptimalConnection = function (pathP1, pathP2, prevPoint, nextPoint) {
	let pairs = [
			[pathP1, pathP2],
			[pathP2, pathP1],
		],
		minLen = Infinity, optPair;

	for (let pair of pairs) {
		let [p1, p2] = pair,
			len = this.getLineLengthMeters([prevPoint, p1]) + this.getLineLengthMeters([nextPoint, p2]);

		if (len < minLen) {
			minLen = len;
			optPair = pair;
		}
	}
	return [[prevPoint, optPair[0]], [optPair[1], nextPoint]];
}

L.ALS.SynthBaseLayer.prototype.connectHullToAirport = function () {
	let airportPos = this._airportMarker.getLatLng();

	for (let i = 0; i < this.paths.length; i++) {

		let path = this.paths[i],
			{connectionsGroup, hullConnection, previouslyRemovedConnection} = path,
			layers = connectionsGroup.getLayers(), minLen = Infinity, toRemove,
			totalLength = 0;

		for (let layer of layers) {
			if (layer === hullConnection)
				continue;
			if (layer.pathLength === undefined)
				layer.pathLength = this.getLineLengthMeters(layer);
			totalLength += layer.pathLength;
		}

		for (let layer of layers) {
			if (layer === hullConnection)
				continue;

			let [p1, p2] = layer.getLatLngs(),
				len = totalLength - layer.pathLength + this.getLineLengthMeters([p1, airportPos]) + this.getLineLengthMeters([p2, airportPos]);

			if (len < minLen) {
				minLen = len;
				toRemove = layer;
			}

		}

		if (!toRemove)
			return;

		if (toRemove !== previouslyRemovedConnection) {
			if (previouslyRemovedConnection)
				previouslyRemovedConnection.setStyle({opacity: 1});

			path.previouslyRemovedConnection = toRemove;
			toRemove.setStyle({opacity: 0});
		}

		let [p1, p2] = toRemove.getLatLngs();
		hullConnection.setLatLngs([p1, airportPos, p2]);
		path.updateWidgets(minLen);
	}
}

/**
 * Called when paths should be connected using hull algorithm. You should call {@link L.ALS.SynthBaseLayer#buildHull} here.
 */
L.ALS.SynthBaseLayer.prototype.connectHull = function () {
	for (let i = 0; i < this.paths.length; i++) {
		let path = this.paths[i];
		this._createPathWidget(path, 1, path.toUpdateColors);
		this.buildHull(path, this.getWidgetById(`color${i}`).getValue());
	}
	this.connectHullToAirport();
}

/**
 * Creates a cycle out of hull connection of given path
 * @param path {Object} Path to create cycle of
 * @return {LatLng[][]} Cycle
 */
L.ALS.SynthBaseLayer.prototype.hullToCycles = function (path) {
	// The idea is to start with the first connection, find the starting point in it and for each connection
	// find the next point of a current connection and add points of its paths. We can do this because connections
	// are ordered. We'll also compare instances of the points because they're copied from the path, and it'll
	// prevent us from dealing with situation when two points are the same.

	let cycle = [];

	// Find a common path between first and last connection
	let firstConnection = path.hullConnections[0], lastConnection = path.hullConnections[path.hullConnections.length - 1],
		commonPath, prevPoint;
	for (let p1 of firstConnection) {
		for (let p2 of lastConnection) {
			if (p1.path === p2.path) {
				commonPath = p1.path;
				break;
			}
		}
	}

	// Find a common point of path and first connection and select it as a starting point
	for (let p1 of commonPath) {
		for (let p2 of firstConnection) {
			if (p1 === p2) {
				prevPoint = p1;
				break;
			}
		}
	}

	// Now we can add paths of the next point of each connection
	for (let i = 0; i < path.hullConnections.length; i++)
		prevPoint = this.getOrderedPathFromHull(prevPoint, path.hullConnections[i], cycle, i);

	cycle.push(cycle[0]); // Close the cycle

	// Now we need to add an airport and shift the points, so the first point will be an airport
	let [hullP1, hullP2, hullP3] = path.hullConnection.getLatLngs(), connectionPairs = [[hullP1, hullP3], [hullP3, hullP1]],
		beforeAirport = [], afterAirport = [], connectionFound = false;

	for (let i = 0; i < cycle.length - 1; i += 2) {
		let p1 = cycle[i], p2 = cycle[i + 1];

		if (connectionFound) {
			afterAirport.push(p1, p2);
			continue;
		}

		for (let pair of connectionPairs) {
			if (pair[0] === p1 && pair[1] === p2) {
				connectionFound = true;
				break;
			}
		}

		if (!connectionFound)
			beforeAirport.push(p1, p2);
		else {
			beforeAirport.push(p1);
			afterAirport.push(p2);
		}
	}

	cycle = [hullP2, ...afterAirport, ...beforeAirport, hullP2];

	this.map.addLayer(L.polyline(cycle, {weight: 10, opacity: 0.5}));
	return [cycle];
}

L.ALS.SynthBaseLayer.prototype.getOrderedPathFromHull = function (prevPoint, connection, copyTo, i = 0) {

	// Find the next point of given connection by checking previous point
	let [connP1, connP2] = connection, nextPoint = connP1 === prevPoint ? connP2 : connP1,
		start = -1, end = nextPoint.actualLayer.length, addition = 1;

	// If the next point is at the end of the path, i.e. points order is reversed, we have to start from the end
	if (nextPoint !== nextPoint.actualLayer[0]) {
		start = end;
		end = -1;
		addition = -1;
	}

	// Copy the points to the cycle
	for (let i = start + addition; i !== end; i += addition)
		copyTo.push(nextPoint.actualLayer[i]);

	return copyTo[copyTo.length - 1]; // Return the last added point which will become a previous point for the next iteration
}

/**
 * Calculates length of a polyline
 * @param line {L.Polyline | L.LatLng[] | number[][]} Line to calculate length of
 * @return {number} Line length
 */
L.ALS.SynthBaseLayer.prototype.getLineLength = function (line) {
	let latLngs = line instanceof Array ? line : line.getLatLngs(), length = 0,
		{x, y} = MathTools.getXYPropertiesForPoint(latLngs[0]);

	for (let i = 0; i < latLngs.length - 1; i++) {
		const p1 = latLngs[i], p2 = latLngs[i + 1];
		length += Math.sqrt((p1[x] - p2[x]) ** 2 + (p1[y] - p2[y]) ** 2);
	}
	return length;
}

L.ALS.SynthBaseLayer.prototype.cross = function (a, b, o) {
	return (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng);
}