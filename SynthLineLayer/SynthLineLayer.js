require("./SynthLineWizard.js");
require("./SynthLineSettings.js");
const geojsonMerge = require("@mapbox/geojson-merge"); // Using this since turfHelpers.featureCollection() discards previously defined properties.

/**
 * Geodesic line layer
 *
 * @class
 * @extends L.ALS.SynthBaseLayer
 */
L.ALS.SynthLineLayer = L.ALS.SynthBaseLayer.extend(/** @lends L.ALS.SynthLineLayer.prototype */{
	defaultName: "Line Layer",
	hideCapturePoints: true,
	hidePathsConnections: false,
	hasYOverlay: false,

	init: function (wizardResults, settings) {
		this.pathsGroup = new L.FeatureGroup();
		this.drawingGroup = new L.FeatureGroup();
		this.connectionsGroup = new L.FeatureGroup();
		this.errorGroup = new L.FeatureGroup();
		this.pointsGroup = new L.FeatureGroup();

		L.ALS.SynthBaseLayer.prototype.init.call(this, settings, this.pathsGroup, this.connectionsGroup, "lineLayerColor");
		this.addLayers(this.errorGroup, this.pointsGroup);

		this.enableDraw({
			polyline: {
				shapeOptions: {
					color: "#ff0000",
					weight: this.lineThicknessValue,
					segmentsNumber: Math.round(L.GEODESIC_SEGMENTS / 4),
				}
			}
		}, this.drawingGroup);

		this.addWidgets(
			new L.ALS.Widgets.Checkbox("hideCapturePoints", "hideCapturePoints", this, "_hideCapturePoints").setValue(true),
			new L.ALS.Widgets.Checkbox("hidePathsConnections", "hidePathsConnections", this, "_hidePathsConnections"),
		);

		this.addBaseParametersInputSection();
		this.addBaseParametersOutputSection();
		L.ALS.SynthGeometryBaseWizard.initializePolygonOrPolylineLayer(this, wizardResults);
	},

	_hideCapturePoints: function (widget) {
		this.hideOrShowLayer(widget.getValue(), this.pointsGroup);
	},

	_hidePathsConnections: function (widget) {
		this.hideOrShowLayer(widget.getValue(), this.connectionsGroup);
	},

	onEditStart: function () {
		if (!this.isSelected)
			return;

		this.map.removeLayer(this.pathsGroup);
		this.map.removeLayer(this.connectionsGroup);
		this.map.removeLayer(this.pointsGroup);
		this.map.addLayer(this.drawingGroup);
	},

	onEditEnd: function (event, notifyIfLayersSkipped = true) {
		if (!this.isSelected)
			return;

		this.pathsGroup.clearLayers();
		this.pointsGroup.clearLayers();
		this.errorGroup.clearLayers();

		let color = this.getWidgetById("color0").getValue(),
			lineOptions = {color, thickness: this.lineThicknessValue},
			linesWereInvalidated = false;

		notifyIfLayersSkipped = typeof notifyIfLayersSkipped === "boolean" ? notifyIfLayersSkipped : true;

		this.drawingGroup.eachLayer((layer) => {
			let latLngs = layer.getLatLngs();
			for (let i = 1; i < latLngs.length; i++) {
				let extendedGeodesic = new L.Geodesic([latLngs[i - 1], latLngs[i]], {segmentsNumber: 2}),
					length = extendedGeodesic.statistics.sphericalLengthMeters,
					numberOfImages = Math.ceil(length / this.Bx) + 4,
					shouldInvalidateLine = numberOfImages > 10000; // Line is way too long for calculated Bx

				// This will throw an error when new length exceeds 180 degrees
				try {
					extendedGeodesic.changeLength("both", (this.Bx * numberOfImages - length) / 2 / length);
				} catch (e) {
					shouldInvalidateLine = true;
				}

				let displayGeodesic = new L.Geodesic(extendedGeodesic.getLatLngs(), {
					...lineOptions,
					segmentsNumber: Math.max(numberOfImages, L.GEODESIC_SEGMENTS)
				});

				if (shouldInvalidateLine) {
					displayGeodesic.setStyle({color: "red"});
					this.errorGroup.addLayer(displayGeodesic);
					linesWereInvalidated = true;
					continue;
				}

				this.pathsGroup.addLayer(displayGeodesic);

				// Capture points made by constructing a line with segments number equal to the number of images
				let pointsArrays = new L.Geodesic(displayGeodesic.getLatLngs(), {
					...lineOptions, segmentsNumber: numberOfImages
				}).getActualLatLngs();

				for (let array of pointsArrays) {
					for (let point of array)
						this.pointsGroup.addLayer(this.createCapturePoint(point, color));
				}
			}
		});

		this.updatePathsMeta();

		this.hideOrShowLayer(this.getWidgetById("hidePathsConnections").getValue(), this.connectionsGroup);
		this.hideOrShowLayer(this.getWidgetById("hideCapturePoints").getValue(), this.pointsGroup);

		this.map.removeLayer(this.drawingGroup);
		this.map.addLayer(this.pathsGroup);

		this.notifyAfterEditing(L.ALS.locale.lineLayersSkipped, linesWereInvalidated, undefined, !notifyIfLayersSkipped);

		this.writeToHistoryDebounced();
	},

	toGeoJSON: function () {
		let pathsMeta = {};
		for (let prop of this.propertiesToExport) {
			if (this[prop] !== undefined)
				pathsMeta[prop] = this[prop];
		}

		return geojsonMerge.merge([
			L.ALS.SynthBaseLayer.prototype.toGeoJSON.call(this, pathsMeta),
			this.pointsGroup.toGeoJSON(),
		]);
	},

	serialize: function (seenObjects) {
		let serialized = this.getObjectToSerializeTo(seenObjects),
			lines = [];

		this.drawingGroup.eachLayer(layer => lines.push(layer.getLatLngs()));
		serialized.lines = L.ALS.Serializable.serializeAnyObject(lines, seenObjects);
		return serialized;
	},

	statics: {
		wizard: L.ALS.SynthLineWizard,
		settings: new L.ALS.SynthLineSettings(),

		deserialize: function (serialized, layerSystem, settings, seenObjects) {
			let object = L.ALS.SynthBaseLayer.deserialize(serialized, layerSystem, settings, seenObjects),
				lines = L.ALS.Serializable.deserialize(serialized.lines, seenObjects);

			for (let line of lines)
				object.drawingGroup.addLayer(new L.Geodesic(line, object.drawControls.polyline.shapeOptions));

			object.isAfterDeserialization = true;
			object.onEditEnd();

			delete object.lines;
			return object;
		}
	}
});