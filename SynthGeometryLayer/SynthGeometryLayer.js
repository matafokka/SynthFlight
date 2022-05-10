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

	init: function (wizardResults, settings) {
		this.copySettingsToThis(settings);
		this.setConstructorArguments(["deserialized"]);

		if (wizardResults === "deserialized")
			return;

		if (!window.FileReader) {
			this._deleteInvalidLayer(L.ALS.locale.geometryBrowserNotSupported);
			return;
		}

		L.ALS.SynthGeometryBaseWizard.getGeoJSON(wizardResults, (geoJson, name) => this._displayFile(geoJson, name));
	},

	_displayFile: function (geoJson, fileName) {
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
		}

		let borderColor = new L.ALS.Widgets.Color("borderColor", "geometryBorderColor", this, "setColor").setValue(this.borderColor),
			fillColor = new L.ALS.Widgets.Color("fillColor", "geometryFillColor", this, "setColor").setValue(this.fillColor),
			menu = [borderColor, fillColor],
			popupOptions = {
				maxWidth: 500,
				maxHeight: 500,
			};

		if (this.isShapefile) {
			let type = geoJson.features[0].geometry.type;
			if (type === "LineString")
				menu = [borderColor];
			else if (type !== "Polygon")
				menu = [];
		}

		for (let widget of menu)
			this.addWidget(widget);

		let docs = [], fields = []; // Search documents

		this._layer = L.geoJSON(geoJson, {
			onEachFeature: (feature, layer) => {
				let popup = "", doc = {};

				// Calculate bbox for zooming
				if (!feature.geometry.bbox) {
					if (layer.getBounds) {
						let bounds = layer.getBounds();
						feature.geometry.bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
					} else {
						let latLng = layer.getLatLng(), size = 0.008;
						feature.geometry.bbox = [latLng.lng - size, latLng.lat - size, latLng.lng + size, latLng.lat + size];
					}
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

				layer.bindPopup(`<div class="synth-popup">${popup}</div>`, popupOptions);

				doc._miniSearchId = L.ALS.Helpers.generateID();
				doc.bbox = feature.geometry.bbox;
				doc.properties = feature.properties;
				docs.push(doc);
			}
		});

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
			geoJson: this._layer.toGeoJSON(),
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