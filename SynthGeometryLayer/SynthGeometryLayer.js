require("./SynthGeometryWizard.js");
require("./SynthGeometrySettings.js");
const shp = require("shpjs");

/**
 * Layer with geometry from shapefile or GeoJSON
 * @class
 * @extends L.ALS.Layer
 */
L.ALS.SynthGeometryLayer = L.ALS.Layer.extend( /** @lends L.ALS.SynthGeometryLayer.prototype */ {

	defaultName: "geometryDisplayName",
	isShapeFile: false,

	init: function (wizardResults, settings) {
		this.copySettingsToThis(settings);
		this.setConstructorArguments(["deserialized"]);

		if (wizardResults === "deserialized")
			return;

		if (!window.FileReader) {
			this._deleteInvalidLayer(L.ALS.locale.geometryBrowserNotSupported);
			return;
		}

		let file = wizardResults["geometryFileLabel"][0], fileReader = new FileReader();

		if (!file) {
			this._deleteInvalidLayer(L.ALS.locale.geometryNoFileSelected);
			return;
		}

		this.setName(file.name);

		// Try to read as shapefile
		fileReader.addEventListener("load", (event) => {
			this.isShapefile = true; // Will hide unneeded widgets using this
			shp(event.target.result).then((geoJson) => {
				if (geoJson.features.length === 0) {
					this._deleteInvalidLayer(L.ALS.locale.geometryNoFeatures);
					return;
				}

				this._displayFile(geoJson);
				// Check if bounds are valid
				let bounds = this._layer.getBounds();
				if (bounds._northEast.lng > 180 || bounds._northEast.lat > 90 || bounds._southWest.lng < -180 || bounds._southWest.lat < -90)
					window.alert(L.ALS.locale.geometryOutOfBounds);

			}).catch((reason) => {
				console.log(reason);

				// If reading as shapefile fails, try to read as GeoJSON.
				// We won't check bounds because we assume GeoJSON being in WGS84.
				let fileReader2 = new FileReader();
				fileReader2.addEventListener("load", (event) => {
					try {this._displayFile(JSON.parse(event.target.result));}
					catch (e) {
						console.log(e);
						this._deleteInvalidLayer();
					}
				});
				fileReader2.readAsText(file);
			});
		});

		try {fileReader.readAsArrayBuffer(file);}
		catch (e) {}
	},

	_displayFile: function (geoJson) {
		let borderColor = new L.ALS.Widgets.Color("borderColor", "geometryBorderColor", this, "_setColor").setValue(this.borderColor),
			fillColor = new L.ALS.Widgets.Color("fillColor", "geometryFillColor", this, "_setColor").setValue(this.fillColor),
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

		this._layer = L.geoJSON(geoJson, {
			onEachFeature: (feature, layer) => {
				let popup = "";
				for (let name in feature.properties) {
					if (!feature.properties.hasOwnProperty(name))
						continue;
					popup += `
						<p>
							<b>${name}:</b> <span>${feature.properties[name]}</span>
						</p>
					`
				}
				layer.bindPopup(`<div class="synth-popup">${popup}</div>`, popupOptions);
			}
		});

		this.addLayers(this._layer);
		this._setLayerColors();
	},

	_deleteInvalidLayer: function (message = L.ALS.locale.geometryInvalidFile) {
		window.alert(message);
		this.deleteLayer();
	},

	_setColor(widget) {
		this[widget.id] = widget.getValue();
		this._setLayerColors();
	},

	_setLayerColors() {
		let layers = this._layer.getLayers();
		for (let layer of layers) {
			if (!layer.setStyle)
				continue;

			layer.setStyle({
				color: this.borderColor,
				fillColor: this.fillColor,
				fill: layer instanceof L.Polygon
			});
		}
	},

	serialize: function (seenObjects) {
		if (!this.serializationID) {
			this.serializationID = L.ALS.Helpers.generateID();
			seenObjects[this.serializationID] = this;
		}

		let json = {
			widgets: this.serializeWidgets(seenObjects),
			name: this.getName(),
			geoJson: this.toGeoJSON(),
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