require("./SynthShapefileWizard.js");
require("./SynthShapefileSettings.js");
const shp = require("shpjs");

L.ALS.SynthShapefileLayer = L.ALS.Layer.extend({

	defaultName: "Zipped Shapefile",

	/*fillColor: "#ff9900",

	borderColor: "#8d4200",*/

	geometryType: undefined,

	init: function (wizardResults, settings) {
		this.copySettingsToThis(settings);
		this.setConstructorArguments(["deserialized"]);

		if (wizardResults === "deserialized")
			return;

		let file = wizardResults["zippedShapefile"][0]
		let fileReader = new FileReader();
		try { fileReader.readAsArrayBuffer(file); }
		catch (e) {
			this._deleteInvalidLayer();
			return;
		}
		fileReader.addEventListener("load", (event) => {
			shp(event.target.result).then((geoJson) => {
				if (geoJson.features.length === 0) {
					this._deleteInvalidLayer("This shapefile doesn't contain any features so it won't be added");
					return;
				}

				this._displayShapefile(geoJson);
				// Check if bounds are valid
				let bounds = this._layer.getBounds();
				if (bounds._northEast.lng > 180 || bounds._northEast.lat > 90 || bounds._southWest.lng < -180 || bounds._southWest.lat < -90 )
					window.alert("Extent of this shapefile is broken, layer won't be fully displayed on the map. Please, open it in your favourite GIS and fix the extent.");
				this.setName(file.name);

			}).catch((reason => {
				console.log(reason);
				this._deleteInvalidLayer();
			}));
		});
	},

	_displayShapefile: function (geoJson) {
		let borderColor = new L.ALS.Widgets.Color("borderColor", "Border color", this, "_setColor", { "value": this.borderColor });
		let fillColor = new L.ALS.Widgets.Color("fillColor", "Fill color", this, "_setColor", { "value": this.fillColor });

		this.type = geoJson.features[0].geometry.type;
		let menu = [];
		if (this.type === "Polygon")
			menu = [borderColor, fillColor];
		else if (this.type === "LineString")
			menu = [borderColor];
		for (let widget of menu)
			this.addWidget(widget);

		this._layer = L.geoJSON(geoJson);
		this.addLayers(this._layer);
		this._setLayerColors();
	},

	_deleteInvalidLayer: function (message = "This file is not valid zipped shapefile") {
		window.alert(message);
		this.deleteLayer();
	},

	_setColor(widget) {
		this[widget.getId()] = widget.getValue();
		this._setLayerColors();
	},

	_setLayerColors() {
		this._layer.setStyle({
			color: this.borderColor,
			fillColor: this.fillColor,
			fill: this.type === "Polygon"
		});
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

		for (let prop of L.ALS.SynthShapefileLayer.serializationProperties)
			json[prop] = this[prop];

		return json;
	},

	statics: {
		wizard: new L.ALS.SynthShapefileWizard(),
		settings: new L.ALS.SynthShapefileSettings(),

		serializationProperties: ["serializableClassName", "type", "fillColor", "borderColor", "geometryType"],

		deserialize: function (serialized, layerSystem, settings, seenObjects) {
			serialized.constructorArguments = [layerSystem, "deserialized", settings];
			let object = L.ALS.Serializable.getObjectFromSerialized(serialized, seenObjects);
			object.setName(serialized.name);
			for (let prop of L.ALS.SynthShapefileLayer.serializationProperties)
				object[prop] = serialized[prop];
			object._displayShapefile(serialized.geoJson);
			return object;
		}
	},
});