require("./SynthLineWizard.js");
require("./SynthLineSettings.js");
const turfHelpers = require("@turf/helpers");
const MathTools = require("../MathTools.js");

L.ALS.SynthLineLayer = L.ALS.SynthBaseLayer.extend({
	defaultName: "Line Layer",
	hideCapturePoints: true,
	hidePathsConnections: false,
	hasYOverlay: false,

	init: function (wizardResults, settings) {
		this.pathsGroup = L.featureGroup();
		this.drawingGroup = L.featureGroup();
		this.connectionsGroup = L.featureGroup();

		L.ALS.SynthBaseLayer.prototype.init.call(this, settings, this.pathsGroup, this.connectionsGroup, "lineLayerColor");

		this.enableDraw({
			polyline: {
				shapeOptions: {
					color: "#ff0000",
					weight: this.lineThicknessValue
				}
			}
		}, this.drawingGroup);

		this.addWidgets(
			new L.ALS.Widgets.Checkbox("hideCapturePoints", "hideCapturePoints", this, "_hideCapturePoints").setValue(true),
			new L.ALS.Widgets.Checkbox("hidePathsConnections", "hidePathsConnections", this, "_hidePathsConnections"),
		);

		this.addBaseParametersInputSection();
		this.addBaseParametersOutputSection();

		this.pointsGroup = L.featureGroup();
		this.calculateParameters();
	},

	_hideCapturePoints: function (widget) {
		this.hideOrShowLayer(widget.getValue(), this.pointsGroup);
	},

	_hidePathsConnections: function (widget) {
		this.hideOrShowLayer(widget.getValue(), this.connectionsGroup);
	},

	onEditStart: function () {
		this.map.removeLayer(this.pathsGroup);
		this.map.removeLayer(this.connectionsGroup);
		this.map.removeLayer(this.pointsGroup);
		this.map.addLayer(this.drawingGroup);
	},

	onEditEnd: function () {
		// we need to extend paths to hold whole number of images + double basis from each side and draw capture points.
		// To do both, we have to "draw" a line given length (Bx) along the given (drawn by the user) line.

		// Consider a spherical triangle formed by lat and lng with the line as hypotenuse.
		// Let c be line to draw, a - lat difference, b - lng difference, and A, B, C - opposite angles to these sides.

		// We can find sines of angles of a triangle formed by a line to draw along where we know lengths of all sides.
		// In both triangles, C will always be equal to 90 deg, thus, sin C / sin c = 1 / sin c.
		// We can find c by drawing straight line down from north pole using given length in meters.
		// Then we can find a and b by using law of sines.

		// There might be two possible configurations which all will be covered by using absolute values of differences:

		//     b
		//  C ____ A      B
		//   |   /        |\
		//   |  /         | \ c
		// a | / c      a |  \
		//   |/           |___\
		//   B           C  b   A

		// The only problem left is directions, i.e. whether we should add or subtract found sides.
		// Let p1, p2 be the points of given line where p1.lng1 < p2.lng2.
		// To draw a line by p1 -> p2 direction, we always add to lng and subtract from lat, if lat2 > lat1.
		// To draw a line by p2 -> p1 direction, we always subtract from lng and add to lat, if lat2 > lat1.

		/* For better understanding, see this code I used for testing:

		let x1 = 0, y1 = 51.5, x2 = 2, y2 = 52,
			refLength = this.getLineLengthMeters([[x1, y1], [x2, y2]]),
			requiredLength = refLength / 2,
			refC = turfHelpers.degreesToRadians(this.getArcAngleByLength([0, 0], refLength, true)),
			c = turfHelpers.degreesToRadians(this.getArcAngleByLength([0, 0], requiredLength, true)),
			// When it'll be equal to pi (180 deg), the world will collapse, and no one will need this program.
			// Thus, we won't cover this case.
			refSinC = Math.sin(refC),
			sinC = Math.sin(c),
			sinA = Math.sin(turfHelpers.degreesToRadians(Math.abs(y2 - y1))) / refSinC,
			sinB = Math.sin(turfHelpers.degreesToRadians(Math.abs(x2 - x1))) / refSinC,
			a = turfHelpers.radiansToDegrees(Math.asin(sinA * sinC)) * (y1 < y2 ? 1 : -1),
			b = turfHelpers.radiansToDegrees(Math.asin(sinB * sinC));

		map.addLayer(L.polyline([[y1, x1], [y2, x2]]));
		map.addLayer(L.polyline([[y1, x1], [y1 + a, x1 + b]], {color: "#6c00ff"}));
		*/

		// Sorry for the quality of the rest of the code, it's done for optimization

		this.pathsGroup.clearLayers();
		this.pointsGroup.clearLayers();

		let layers = this.drawingGroup.getLayers(), color = this.getWidgetById("color0").getValue(), lineOptions = {
			color, thickness: this.lineThicknessValue,
		};

		for (let layer of layers) {
			let points = layer.getLatLngs();

			for (let i = 0; i < points.length - 1; i++) {
				let lineP1 = L.LatLngUtil.cloneLatLng(points[i]),
					lineP2 = L.LatLngUtil.cloneLatLng(points[i + 1]),
					p1, p2;

				// Swap points when needed, so we can always subtract from first point and add to the second point
				if (lineP1.lng < lineP2.lng) {
					p1 = lineP1;
					p2 = lineP2;
				} else {
					p1 = lineP2;
					p2 = lineP1;
				}

				let latSign = p1.lat < p2.lat ? 1: -1,
					length = this.getLineLengthMeters([p1, p2]),
					numberOfImages = Math.ceil(length / this.Bx) + 4,
					sinC = this.sineOfSideC((this.Bx * numberOfImages - length) / 2),
					refSinC = this.sineOfSideC(length),
					sinA = Math.sin(turfHelpers.degreesToRadians(Math.abs(p2.lat - p1.lat))) / refSinC,
					sinB = Math.sin(turfHelpers.degreesToRadians(Math.abs(p2.lng - p1.lng))) / refSinC,
					moveByLat = this.sideLength(sinA, sinC) * latSign,
					moveByLng = this.sideLength(sinB, sinC);
				p1.lng -= moveByLng;
				p1.lat -= moveByLat;
				p2.lng += moveByLng;
				p2.lat += moveByLat;
				this.pathsGroup.addLayer(L.polyline([p1, p2], lineOptions));

				// Add capture points
				sinC = this.sineOfSideC(this.Bx);
				moveByLat = this.sideLength(sinA, sinC) * latSign;
				moveByLng = this.sideLength(sinB, sinC);
				let {lat, lng} = p1, toCompare = [p2.lat, p2.lng];
				while (!MathTools.arePointsEqual([lat - moveByLat, lng - moveByLng], toCompare)) {
					this.pointsGroup.addLayer(this.createCapturePoint([lat, lng], color));
					lat += moveByLat;
					lng += moveByLng;
				}
			}
		}

		this.updatePathsMeta();

		if (!this.getWidgetById("hidePathsConnections").getValue())
			this.map.addLayer(this.connectionsGroup);

		if (!this.getWidgetById("hideCapturePoints").getValue())
			this.map.addLayer(this.pointsGroup);

		this.map.removeLayer(this.drawingGroup);
		this.map.addLayer(this.pathsGroup);

		this.writeToHistory();
	},

	sineOfSideC: function (length) {
		return Math.sin(turfHelpers.degreesToRadians(this.getArcAngleByLength([0, 0], length, true)));
	},

	sideLength: function (sinAngle, sinC) {
		return turfHelpers.radiansToDegrees(Math.asin(sinAngle * sinC));
	},

	statics: {
		wizard: L.ALS.SynthLineWizard,
		settings: new L.ALS.SynthLineSettings(),
	}
});