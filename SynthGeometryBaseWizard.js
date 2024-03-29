const shp = require("shpjs");

/**
 * Wizard with file reader and Shapefile and GeoJSON parser
 * @class
 * @extends L.ALS.Wizard
 */
L.ALS.SynthGeometryBaseWizard = L.ALS.Wizard.extend(/** @lends L.ALS.SynthGeometryBaseWizard.prototype */{

	fileLabel: "geometryFileLabel",
	browserNotSupportedLabel: "initialFeaturesBrowserNotSupported",

	initialize: function () {

		L.ALS.Wizard.prototype.initialize.call(this);
		if (!window.FileReader) {
			this.addWidget(new L.ALS.Widgets.SimpleLabel("lbl", this.browserNotSupportedLabel, "center", "error"));
			return;
		}

		this.addWidget(
			new L.ALS.Widgets.File("file", this.fileLabel)
		);
	},

	statics: {
		/**
		 * Callback to pass to {@link L.ALS.SynthGeometryBaseWizard.getGeoJSON}.
		 *
		 * @callback getGeoJSONCallback
		 * @param {Object|"NoFileSelected"|"NoFeatures"|"InvalidFileType"|"ProjectionNotSupported"} geoJson GeoJSON or an error message
		 * @param {string|undefined} [fileName=undefined] Name of the loaded file
		 * @param {boolean|undefined} [isShapefile=undefined] If selected file is shapefile
		 */

		/**
		 * Reads GeoJSON or ShapeFile and calls a callback with the content as GeoJSON and filename.
		 *
		 * If an error occurred, the first argument will be an error text, and filename will be `undefined`.
		 *
		 * @param wizardResults Wizard results
		 * @param callback {getGeoJSONCallback}
		 */
		getGeoJSON: function (wizardResults, callback) {
			let file = wizardResults["file"][0],
				fileReader = new FileReader();

			if (!file) {
				callback("NoFileSelected");
				return;
			}

			// Try to read as shapefile
			fileReader.addEventListener("load", (event) => {
				shp(event.target.result).then((geoJson) => {
					if (geoJson.features.length === 0) {
						callback("NoFeatures");
						return;
					}

					callback(geoJson, file.name, true);

				}).catch((reason) => {
					// If reason is string, proj4js doesn't support file projection
					console.log(reason);
					if (typeof reason === "string") {
						callback("ProjectionNotSupported");
						return;
					}

					// If reading as shapefile fails, try to read as GeoJSON.
					// We won't check bounds because we assume GeoJSON being in WGS84.
					let fileReader2 = new FileReader();
					fileReader2.addEventListener("load", (event) => {
						let json;

						try {
							json = JSON.parse(event.target.result);
						} catch (e) {
							console.log(e);
							callback("InvalidFileType");
							return;
						}

						callback(json, file.name, false);
					});
					fileReader2.readAsText(file);
				});
			});

			try {fileReader.readAsArrayBuffer(file);}
			catch (e) {}
		},

		/**
		 * Adds initial shapefile or GeoJSON file to the {@link L.ALS.SynthPolygonLayer} or {@link L.ALS.SynthLineLayer} and updates layer parameters
		 *
		 * @param synthLayer {L.ALS.SynthPolygonLayer|L.ALS.SynthLineLayer} Pass `this` here
		 * @param wizardResults Wizard results
		 */
		initializePolygonOrPolylineLayer: function (synthLayer, wizardResults) {
			let groupToAdd, layerType, CastTo,
				finishLoading = () => {
					synthLayer.calculateParameters(true);
					synthLayer.isAfterDeserialization = false;
				}

			if (!window.FileReader) {
				finishLoading();
				return;
			}

			if (synthLayer instanceof L.ALS.SynthPolygonLayer) {
				groupToAdd = synthLayer.polygonGroup;
				layerType = L.Polygon;
				CastTo = L.Polygon;
			} else {
				groupToAdd = synthLayer.drawingGroup;
				layerType = L.Polyline;
				CastTo = L.Geodesic;
			}

			this.getGeoJSON(wizardResults, geoJson => {
				switch (geoJson) {
					case "NoFileSelected":
						finishLoading();
						return;
					case "NoFeatures":
						window.alert(L.ALS.locale.geometryNoFeatures);
						finishLoading();
						return;
					case "InvalidFileType":
						window.alert(L.ALS.locale.geometryInvalidFile);
						finishLoading();
						return;
					case "ProjectionNotSupported":
						window.alert(L.ALS.locale.geometryProjectionNotSupported);
						finishLoading();
						return;
				}

				let layersAdded = false;
				let leafletGeoJson = L.geoJson(geoJson, {
					onEachFeature: (feature, layer) => {
						if (!(layer instanceof layerType))
							return;

						groupToAdd.addLayer(new CastTo(layer.getLatLngs()));
						layersAdded = true;
					}
				});

				if(layersAdded)
					this.checkGeoJSONBounds(leafletGeoJson);
				else
					window.alert(L.ALS.locale.initialFeaturesNoFeatures);

				finishLoading();
			});
		},

		checkGeoJSONBounds: function (layer) {
			let {_northEast, _southWest} = layer.getBounds();
			if (
				_northEast.lng > 360 ||
				_northEast.lat > 90 ||
				_southWest.lng < -360 ||
				_southWest.lat < -90
			)
				window.alert(L.ALS.locale.geometryOutOfBounds);
		},
	}
})