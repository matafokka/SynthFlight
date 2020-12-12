const shp = require("shpjs");

L.ALS.SynthShapefileLayer = L.ALS.Layer.extend({

	defaultName: "Zipped Shapefile",

	fillColor: "#ff9900",

	borderColor: "#8d4200",

	init: function (wizardResults) {
		// TODO: Support IE
		//if (window.navigator.userAgent.indexOf('Trident/') !== -1) {}

		let fileReader = new FileReader();
		fileReader.readAsArrayBuffer(wizardResults["zippedShapefile"][0]);
		fileReader.addEventListener("load", (event) => {
			shp(event.target.result).then((geoJson) => {
				console.log(geoJson);
				this._layer = L.geoJSON(geoJson);
				this.addLayers(this._layer);
				this._setLayerColors();

				// Check if bounds are valid
				let bounds = this._layer.getBounds();
				if (!this.map.getBounds().contains(bounds))
					window.alert("Extent of this shapefile is broken, layer won't be fully displayed on the map. Please, open it in your favourite GIS and fix the extent.");

			}).catch((reason => {
				console.log(reason);
				window.alert("This file is not valid zipped shapefile");
			}));
		});


	},

	_changeColor(property, event) {
		this[property] = event.target.value;
		this._setLayerColors();
	},

	_setLayerColors() {
		this._layer.setStyle({
			color: this.borderColor,
			fillColor: this.fillColor,
			fill: true
		});
	},

	_zoomToFit() {
		this.map.fitBounds(this._layer.getBounds());
	},

	statics: {
		wizard: {
			displayName: "Zipped Shapefile",
			controls: [{
				type: "file",
				id: "zippedShapefile",
				label: "Load zipped shapefile",
			}]
		}
	},

	createMenu: function () {
		return [
			{
				type: "color",
				id: "fillColor",
				label: "fillColor",
				parameters: { "value": this.fillColor },
				eventHandlers: { "edit": (event) => { this._changeColor("fillColor", event); } }
			},

			{
				type: "color",
				id: "borderColor",
				label: "Border color",
				parameters: { "value": this.borderColor },
				eventHandlers: { "edit": (event) => { this._changeColor("borderColor", event); } }
			},

			{
				type: "button",
				id: "zoomToFit",
				parameters: { "value": "Zoom to fit" },
				eventHandlers: { "click": () => { this._zoomToFit(); } }
			}
		];
	}
});