require("./SynthGeometryWizard.js");
require("./SynthGeometrySettings.js");

/**
 * Layer with geometry from shapefile or GeoJSON
 * @class
 * @extends L.ALS.Layer
 */
L.ALS.SynthGeometryLayer = L.ALS.Layer.extend( /** @lends L.ALS.SynthGeometryLayer.prototype */ {

	defaultName: "geometryDisplayName",
	isShapeFile: false,
	writeToHistoryOnInit: false,

	init: function (wizardResults, settings, cancelCreation) {
		this.copySettingsToThis(settings);
		this.setConstructorArguments(["deserialized"]);

		if (wizardResults === "deserialized")
			return;

		if (!window.FileReader) {
			window.alert(L.ALS.locale.geometryBrowserNotSupported);
			cancelCreation();
			return;
		}

		L.ALS.SynthGeometryBaseWizard.getGeoJSON(wizardResults, (geoJson, name) => this._displayFile(geoJson, name));
	},

	_displayFile: function (geoJson, fileName, isShapefile) {
		if (fileName)
			this.setName(fileName);

		switch (geoJson) {
			case "NoFileSelected":
				this._deleteInvalidLayer(L.ALS.locale.geometryNoFileSelected);
				return;
			case "NoFeatures":
				this._deleteInvalidLayer(L.ALS.locale.geometryNoFeatures);
				return;
			case "InvalidFileType":
				this._deleteInvalidLayer(L.ALS.locale.geometryInvalidFile);
				return;
			case "ProjectionNotSupported":
				this._deleteInvalidLayer(L.ALS.locale.geometryProjectionNotSupported);
				return;
		}

		this.originalGeoJson = geoJson;

		let borderColor = new L.ALS.Widgets.Color("borderColor", "geometryBorderColor", this, "setColor").setValue(this.borderColor),
			fillColor = new L.ALS.Widgets.Color("fillColor", "geometryFillColor", this, "setColor").setValue(this.fillColor),
			menu = [borderColor, fillColor],
			popupOptions = {
				maxWidth: 500,
				maxHeight: 500,
			};

		this.isShapefile = this.isShapefile || isShapefile;

		if (this.isShapefile) {
			let type = geoJson.features[0].geometry.type;
			if (type === "LineString")
				menu = [borderColor];
			else if (type !== "Polygon")
				menu = [];
		}

		for (let widget of menu)
			this.addWidget(widget);

		let docs = [], fields = [], clonedLayers = []; // Search documents

		this._layer = new L.GeoJSON(geoJson, {
			onEachFeature: (feature, layer) => {
				let popup = "", doc = {}, bbox;

				// Calculate bbox for zooming
				if (layer.getBounds) {
					let bounds = layer.getBounds(), west = bounds.getWest(), east = bounds.getEast();
					bbox = [west, bounds.getSouth(), east, bounds.getNorth()];

					// Check if layer crosses one of antimeridians
					let moveBy = 0, crossesLeft = west < -180, crossesRight = east > 180;

					if (crossesLeft && crossesRight)
						moveBy = 0;
					else if (crossesLeft)
						moveBy = 360;
					else if (crossesRight)
						moveBy = -360;

					// Clone layer
					if (moveBy) {
						// Move bbox
						for (let i = 0; i <= 2; i += 2)
							bbox += moveBy;

						// Clone coordinates
						let latLngs = layer.getLatLngs(), clonedLatLngs = [];

						if (latLngs.length === 0 || latLngs[0] instanceof L.LatLng)
							latLngs = [latLngs];

						for (let array of latLngs) {
							let clonedArray = [];
							for (let coord of array) {
								let clonedCoord = coord.clone();
								clonedCoord.lng += moveBy;
								clonedArray.push(clonedCoord);
							}
							clonedLatLngs.push(clonedArray);
						}

						// Create cloned layer
						let clonedLayer = layer instanceof L.Polygon ? new L.Polygon(clonedLatLngs) :
							new L.Polyline(clonedLatLngs);
						layer.clone = clonedLayer;
						clonedLayers.push(clonedLayer);
					}
				} else {
					let latLng = layer.getLatLng().wrap(), size = 0.008;
					layer.setLatLng(latLng); // Wrap points
					bbox = [latLng.lng - size, latLng.lat - size, latLng.lng + size, latLng.lat + size];
				}

				// Copy properties to the popup and search doc
				for (let name in feature.properties) {
					if (!feature.properties.hasOwnProperty(name))
						continue;
					let value = feature.properties[name]
					popup += `
						<p>
							<b>${name}:</b> <span>${value}</span>
						</p>
					`;
					doc[name] = value;
					fields.push(name);
				}

				if (!popup)
					popup = "<div>No data</div>";

				for (let lyr of [layer, layer.clone]) {
					if (lyr)
						lyr.bindPopup(`<div class="synth-popup">${popup}</div>`, popupOptions);
				}

				doc._miniSearchId = L.ALS.Helpers.generateID();
				doc.bbox = bbox;
				doc.properties = feature.properties;
				docs.push(doc);
			}
		});

		for (let layer of clonedLayers)
			this._layer.addLayer(layer);

		// Check if bounds are valid
		L.ALS.SynthGeometryBaseWizard.checkGeoJSONBounds(this._layer);

		if (L.ALS.searchWindow)
			L.ALS.searchWindow.addToSearch(this.id, docs, fields); // Add GeoJSON to search
		this.addLayers(this._layer);
		this._setLayerColors();
		this.writeToHistory();
	},

	_deleteInvalidLayer: function (message) {
		window.alert(message);
		this.deleteLayer();
	},

	setColor(widget) {
		this[widget.id] = widget.getValue();
		this._setLayerColors();
	},

	_setLayerColors() {
		this._layer.eachLayer((layer) => {
			if (!layer.setStyle)
				return;

			layer.setStyle({
				color: this.borderColor,
				fillColor: this.fillColor,
				fill: layer instanceof L.Polygon
			});
		});
	},

	onDelete: function () {
		if (L.ALS.searchWindow)
			L.ALS.searchWindow.removeFromSearch(this.id);
	},

	serialize: function (seenObjects) {
		if (!this.serializationID) {
			this.serializationID = L.ALS.Helpers.generateID();
			seenObjects[this.serializationID] = this;
		}

		let json = {
			widgets: this.serializeWidgets(seenObjects),
			name: this.getName(),
			geoJson: this.originalGeoJson,
			serializationID: this.serializationID
		};

		for (let prop of L.ALS.SynthGeometryLayer.serializationProperties)
			json[prop] = this[prop];

		return json;
	},

	statics: {
		wizard: L.ALS.SynthGeometryWizard,
		settings: new L.ALS.SynthGeometrySettings(),

		serializationProperties: ["serializableClassName", "isShapefile", "fillColor", "borderColor"],

		deserialize: function (serialized, layerSystem, settings, seenObjects) {
			serialized.constructorArguments = [layerSystem, "deserialized", settings];
			let object = L.ALS.Serializable.getObjectFromSerialized(serialized, seenObjects);
			object.setName(serialized.name);
			for (let prop of L.ALS.SynthGeometryLayer.serializationProperties)
				object[prop] = serialized[prop];
			object._displayFile(serialized.geoJson);
			return object;
		}
	},
});