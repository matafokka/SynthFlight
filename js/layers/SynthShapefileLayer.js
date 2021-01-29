require("./SynthShapefileWizard.js");
const shp = require("shpjs");

L.ALS.SynthShapefileLayer = L.ALS.Layer.extend({

	defaultName: "Zipped Shapefile",

	fillColor: "#ff9900",

	borderColor: "#8d4200",

	geometryType: undefined,

	init: function (wizardResults) {
		let borderColor = new L.ALS.Widgets.Color("borderColor", "Border color", this, "_setColor", { "value": this.borderColor });
		let fillColor = new L.ALS.Widgets.Color("fillColor", "Fill color", this, "_setColor", { "value": this.fillColor });

		let file = wizardResults["zippedShapefile"][0]
		let fileReader = new FileReader();
		fileReader.readAsArrayBuffer(file);
		fileReader.addEventListener("load", (event) => {
			shp(event.target.result).then((geoJson) => {
				if (geoJson.features.length === 0) {
					window.alert("This shapefile doesn't contain any features so it won't be added.");
					this.deleteLayer();
					return;
				}

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

				// Check if bounds are valid
				let bounds = this._layer.getBounds();
				if (bounds._northEast.lng > 180 || bounds._northEast.lat > 90 || bounds._southWest.lng < -180 || bounds._southWest.lat < -90 )
					window.alert("Extent of this shapefile is broken, layer won't be fully displayed on the map. Please, open it in your favourite GIS and fix the extent.");
				this.setName(file.name);

			}).catch((reason => {
				console.log(reason);
				window.alert("This file is not valid zipped shapefile");
				this.deleteLayer();
			}));
		});
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

	statics: {
		wizard: new L.ALS.SynthShapefileWizard()
	},
});