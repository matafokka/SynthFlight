require("./SynthLineWizard.js");
require("./SynthLineSettings.js");
const geojsonMerge = require("@mapbox/geojson-merge"); // Using this since turfHelpers.featureCollection() discards previously defined properties.
const MathTools = require("../MathTools.js");

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
		this.pathsGroup = L.featureGroup();
		this.drawingGroup = L.featureGroup();
		this.connectionsGroup = L.featureGroup();
		this.errorGroup = L.featureGroup();

		L.ALS.SynthBaseLayer.prototype.init.call(this, settings, this.pathsGroup, this.connectionsGroup, "lineLayerColor");
		this.addLayers(this.errorGroup);

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

		this.pointsGroup = L.featureGroup();
		this.calculateParameters();

		this.isAfterDeserialization = false;
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

	onEditEnd: function () {
		if (!this.isSelected)
			return;

		this.pathsGroup.clearLayers();
		this.pointsGroup.clearLayers();
		this.errorGroup.clearLayers();

		let color = this.getWidgetById("color0").getValue(),
			lineOptions = {
				color, thickness: this.lineThicknessValue, segmentsNumber: L.GEODESIC_SEGMENTS,
			},
			linesWereInvalidated = false;

		this.drawingGroup.eachLayer((layer) => {
			let latLngs = layer.getLatLngs();
			for (let i = 1; i < latLngs.length; i++) {
				let extendedGeodesic = new L.Geodesic([latLngs[i - 1], latLngs[i]], lineOptions),
					length = extendedGeodesic.statistics.sphericalLengthMeters,
					numberOfImages = Math.ceil(length / this.Bx) + 4,
					shouldInvalidateLine = numberOfImages > 10000; // Line is way too long for calculated Bx

				// This will throw an error when new length exceeds 180 degrees
				try {
					extendedGeodesic.changeLength("both", (this.Bx * numberOfImages - length) / 2 / length);
				} catch (e) {
					shouldInvalidateLine = true;
				}

				if (shouldInvalidateLine) {
					extendedGeodesic.setStyle({color: "red"});
					this.errorGroup.addLayer(extendedGeodesic);
					linesWereInvalidated = true;
					continue;
				}

				this.pathsGroup.addLayer(extendedGeodesic);

				// Capture points made by constructing a line with segments number equal to the number of images
				let points = new L.Geodesic(extendedGeodesic.getLatLngs(), {
					...lineOptions, segmentsNumber: numberOfImages
				}).getActualLatLngs()[0];

				for (let point of points)
					this.pointsGroup.addLayer(this.createCapturePoint(point, color));
			}
		});

		this.updatePathsMeta();

		if (!this.getWidgetById("hidePathsConnections").getValue())
			this.map.addLayer(this.connectionsGroup);

		if (!this.getWidgetById("hideCapturePoints").getValue())
			this.map.addLayer(this.pointsGroup);

		this.map.removeLayer(this.drawingGroup);
		this.map.addLayer(this.pathsGroup);

		if (linesWereInvalidated)
			window.alert(L.ALS.locale.lineLayersSkipped);

		this.writeToHistoryDebounced();
	},

	calculateParameters: function () {
		L.ALS.SynthBaseLayer.prototype.calculateParameters.call(this);
		this.onEditEnd();
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
		let lines = [];
		this.drawingGroup.eachLayer(layer => lines.push(layer.getLatLngs()));

		let serialized = this.getObjectToSerializeTo(seenObjects);
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