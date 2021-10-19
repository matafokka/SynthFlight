L.ALS.SynthLineLayer = L.ALS.SynthBaseDrawLayer.extend({
	defaultName: "Line Layer",
	hasYOverlay: false,
	hideCapturePoints: true,
	hidePathsConnections: false,

	init: function (wizardResults, settings) {

		this.drawControls = {
			polyline: {
				shapeOptions: {
					color: "#ff0000"
				}
			}
		}

		this.addWidgets(
			new L.ALS.Widgets.Checkbox("hideCapturePoints", "hideCapturePoints", this, "_hideCapturePoints").setValue(true),
			new L.ALS.Widgets.Checkbox("hidePathsConnections", "hidePathsConnections", this, "_hidePathsConnections"),
			new L.ALS.Widgets.Color("color", "lineLayerColor", this, "setColorByWidget").setValue(settings.color)
		);

		this.pointsGroup = L.featureGroup();
		this.connectionsGroup = L.featureGroup();

		L.ALS.SynthBaseDrawLayer.prototype.init.call(this, wizardResults, settings);
		this.setColor(settings.color);
		this.addEventListenerTo(this.map, "draw:drawstart draw:editstart draw:deletestart", "onEditStart");
		this.addEventListenerTo(this.map, "draw:drawstop draw:editstop draw:deletestop", "updatePaths");
	},

	onEditStart: function () {
		this.map.removeLayer(this.connectionsGroup);
		this.map.removeLayer(this.pointsGroup);
	},

	updatePaths: function () {
		this.connectPaths();

		if (!this.getWidgetById("hidePathsConnections").getValue())
			this.map.addLayer(this.connectionsGroup)

		if (!this.getWidgetById("hideCapturePoints").getValue())
			this.map.addLayer(this.pointsGroup)
	},

	_hideCapturePoints: function (widget) {
		this.hideCapturePoints = widget.getValue();
		this.updatePaths();
	},
	_hidePathsConnections: function (widget) {
		this.hidePathsConnections = widget.getValue();
		this.updatePaths();
	},

	onMarkerDrag: function () {
		L.ALS.SynthBaseLayer.prototype.onMarkerDrag.call(this);
		this.updatePaths();
	},

	/**
	 * Connects paths
	 */
	connectPaths: function () {
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

		this.connectionsGroup.clearLayers();

		const points = [], layers = this.drawingGroup.getLayers(), airportPos = this._airportMarker.getLatLng(),
			lineOptions = {
				color: this.drawControls.polyline.shapeOptions.color,
				dashArray: "4 8",
			};

		if (layers.length === 0)
			return;

		if (layers.length === 1) {
			const path = layers[0].getLatLngs();
			this.connectionsGroup.addLayer(L.polyline(
				[path[0], airportPos, path[path.length - 1]],
				lineOptions
			));
			return;
		}

		// Get points from each path and mark them as belonged to a current path
		// TODO: Remove debug props before release
		let debugProps = {color: "purple"}, paths = {}, pathsCount = layers.length; // Keep paths for merging
		for (let path of layers) {
			const layer = path.getLatLngs(), endPoints = [layer[0], layer[layer.length - 1]];
			//this.connectionsGroup.addLayer(L.polyline(endPoints, debugProps));

			endPoints.connectionId = L.ALS.Helpers.generateID();
			paths[endPoints.connectionId] = endPoints;

			for (let p of endPoints) {
				const newP = L.latLng(p);
				newP.path = endPoints;
				points.push(newP);
			}
		}

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

		// Second path was built relying on unoptimized first line, so we have to rotate second line again.
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
							len = this.getLineLength(line1) + this.getLineLength(line2);

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

		// Add connections except one closest to the airport. We'll connect the airport to the paths using the shortest connection.
		let minLen = Infinity, toRemove;
		for (let pair of optConnections) {
			let len = this.getLineLength([pair[0], airportPos]) + this.getLineLength([pair[1], airportPos]);
			if (len > minLen) {
				this.connectionsGroup.addLayer(L.polyline(pair, lineOptions));
				continue;
			}
			minLen = len;
			if (toRemove)
				this.connectionsGroup.addLayer(L.polyline(toRemove, lineOptions));
			toRemove = pair;
		}

		this.connectionsGroup.addLayer(L.polyline([
			toRemove[0], airportPos, toRemove[1], // TODO: When implementing export, check if we need to add pairs instead of this
		], lineOptions));
	},

	/**
	 * Rotates a path in hull and returns a pair of optimal connections
	 * @param pathP1 {LatLng|number[]} First point of path
	 * @param pathP2 {LatLng|number[]} Second point of path
	 * @param prevPoint {LatLng|number[]} Previous point
	 * @param nextPoint {LatLng|number[]} Next point
	 * @return A pair of optimal connections
	 */
	getHullOptimalConnection: function (pathP1, pathP2, prevPoint, nextPoint) {
		let pairs = [
				[pathP1, pathP2],
				[pathP2, pathP1],
			],
			minLen = Infinity, optPair;

		for (let pair of pairs) {
			let [p1, p2] = pair,
				len = this.getLineLength([prevPoint, p1]) + this.getLineLength([nextPoint, p2]);
			if (len < minLen) {
				minLen = len;
				optPair = pair;
			}
		}
		return [[prevPoint, optPair[0]], [optPair[1], nextPoint]];
	},

	cross: function (a, b, o) {
		return (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng);
	},

	/**
	 * Calculates length of a polyline
	 * @param line {L.Polyline|number[][]} Line to calculate length of. If array provided, lat-lng order doesn't matter as long as its consistent.
	 * @return {number} Line length
	 */
	getLineLength: function (line) {
		const latLngs = line instanceof Array ? line : line.getLatLngs();
		let length = 0;
		for (let i = 0; i < latLngs.length; i += 2) {
			const pt1 = latLngs[i], pt2 = latLngs[i + 1];
			length += Math.sqrt(
				((pt1?.lat || pt1[0]) - (pt2.lat || pt2[0])) ** 2 +
				((pt1.lng || pt1[1]) - (pt2.lng || pt2[1])) ** 2
			);
		}
		return length;
	},

	setColorByWidget: function (widget) {
		this.setColor(widget.getValue())
	},

	setColor: function (color) {
		this.drawControls.polyline.shapeOptions.color = color;
		for (let layer of this.drawingGroup.getLayers())
			layer.setStyle({color});
	},

	onDraw: function (e) {
		L.ALS.SynthBaseDrawLayer.prototype.onDraw.call(this, e);
		e.layer.setStyle({
			color: this.getWidgetById("color").getValue(),
			opacity: 1
		});
	},

	statics: {
		wizard: L.ALS.SynthLineWizard,
		settings: new L.ALS.SynthLineSettings(),
	}
});