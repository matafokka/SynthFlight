const turfHelpers = require("@turf/helpers");

/**
 * Base layer. Provides airport markers, basic calculations and menu entries for them.
 *
 * Call {@link L.ALS.SynthBaseLayer#init} after you've created a menu!
 *
 * @class
 * @extends L.ALS.Layer
 */
L.ALS.SynthBaseLayer = L.ALS.Layer.extend(/** @lends L.ALS.SynthBaseLayer.prototype */{

	init: function () {
		this.serializationIgnoreList.push("_airportMarker");

		// Add airport
		let icon = L.divIcon({
			iconSize: null,
			className: "",
			html: "<div class='grd-lyr-airport-icon ri ri-flight-takeoff-line'></div>"
		})

		this._airportMarker = L.marker(this.map.getCenter(), {
			icon: icon,
			draggable: true
		});

		// Set inputs' values to new ones on drag
		this.addEventListenerTo(this._airportMarker, "drag", "onMarkerDrag");
		this.addLayers(this._airportMarker);
		this._airportMarker.fire("drag"); // Just to set values
	},

	addBaseParametersInputSection: function () {
		this.addWidgets(
			new L.ALS.Widgets.Divider("div1"),

			new L.ALS.Widgets.Number("airportLat", "airportLat", this, "setAirportLatLng").setMin(-90).setMax(90).setStep(0.01),
			new L.ALS.Widgets.Number("airportLng", "airportLng", this, "setAirportLatLng").setMin(-180).setMax(180).setStep(0.01),
			new L.ALS.Widgets.Number("aircraftSpeed", "aircraftSpeed", this, "calculateParameters").setMin(1).setStep(1).setValue(350),
			new L.ALS.Widgets.Number("imageScale", "imageScale", this, "calculateParameters").setMin(1).setStep(1).setValue(25000),

			new L.ALS.Widgets.Number("cameraWidth", "cameraWidth", this, "calculateParameters").setMin(1).setStep(1).setValue(17000),
			new L.ALS.Widgets.Number("cameraHeight", "cameraHeight", this, "calculateParameters").setMin(1).setStep(1).setValue(17000),
			new L.ALS.Widgets.Number("pixelWidth", "pixelWidth", this, "calculateParameters").setMin(0.1).setStep(0.1).setValue(5),
			new L.ALS.Widgets.Number("overlayBetweenPaths", "overlayBetweenPaths", this, "calculateParameters").setMin(60).setMax(100).setStep(0.1).setValue(60),
			new L.ALS.Widgets.Number("overlayBetweenImages", "overlayBetweenImages", this, "calculateParameters").setMin(30).setMax(100).setStep(0.1).setValue(30),
			new L.ALS.Widgets.Number("focalLength", "focalLength", this, "calculateParameters").setMin(0.001).setStep(1).setValue(112),

			new L.ALS.Widgets.SimpleLabel("calculateParametersError").setStyle("error"),
			new L.ALS.Widgets.SimpleLabel("cameraParametersWarning").setStyle("warning"),

			new L.ALS.Widgets.Divider("div2"),
		);
	},

	addBaseParametersOutputSection: function () {
		let valueLabels = [
			new L.ALS.Widgets.ValueLabel("flightHeight", "flightHeight"),
			new L.ALS.Widgets.ValueLabel("lx", "lx", "m"),
			new L.ALS.Widgets.ValueLabel("Lx", "Lx", "m"),
			new L.ALS.Widgets.ValueLabel("Bx", "Bx", "m"),
			new L.ALS.Widgets.ValueLabel("ly", "ly", "m"),
			new L.ALS.Widgets.ValueLabel("Ly", "Ly", "m"),
			new L.ALS.Widgets.ValueLabel("By", "By", "m"),
			new L.ALS.Widgets.ValueLabel("GSI", "GSI", "m"),
			new L.ALS.Widgets.ValueLabel("IFOV", "IFOV", "μrad"),
			new L.ALS.Widgets.ValueLabel("GIFOV", "GIFOV", "m"),
			new L.ALS.Widgets.ValueLabel("FOV", "FOV", "deg"),
			new L.ALS.Widgets.ValueLabel("GFOV", "GFOV", "m"),
		];

		for (let widget of valueLabels) {
			widget.setFormatNumbers(true);
			this.addWidget(widget);
		}
	},

	calculateParameters: function () {
		let parameters = ["cameraWidth", "cameraHeight", "pixelWidth", "focalLength", "imageScale", "overlayBetweenPaths", "overlayBetweenImages", "aircraftSpeed"];
		for (let param of parameters)
			this[param] = this.getWidgetById(param).getValue();
		this.flightHeight = this["imageScale"] * this["focalLength"];

		let cameraParametersWarning = this.getWidgetById("cameraParametersWarning");
		if (this["cameraHeight"] > this["cameraWidth"])
			cameraParametersWarning.setValue("errorCamHeight");
		else
			cameraParametersWarning.setValue("");

		let pixelWidth = this["pixelWidth"] * 1e-6;
		let focalLength = this["focalLength"] * 0.001;

		this.ly = this["cameraWidth"] * pixelWidth; // Image size in meters
		this.Ly = this.ly * this["imageScale"] // Image width on the ground
		this.By = this.Ly * (100 - this["overlayBetweenPaths"]) / 100; // Distance between paths

		this.lx = this["cameraHeight"] * pixelWidth; // Image height
		this.Lx = this.lx * this["imageScale"]; // Image height on the ground
		this.Bx = this.Lx * (100 - this["overlayBetweenImages"]) / 100; // Capture basis, distance between images' centers
		this.basis = turfHelpers.lengthToDegrees(this.Bx, "meters");

		this.GSI = pixelWidth * this["imageScale"];
		this.IFOV = pixelWidth / focalLength * 1e6;
		this.GIFOV = this.GSI;
		this.FOV = this["cameraWidth"] * this.IFOV;
		this.GFOV = this["cameraWidth"] * this.GSI;

		this.aircraftSpeedInMetersPerSecond = this["aircraftSpeed"] * 1 / 36;

		let names = ["flightHeight", "lx", "Lx", "Bx", "ly", "Ly", "By", "GSI", "IFOV", "GIFOV", "FOV", "GFOV",];
		for (let name of names) {
			let value;
			try {
				value = this.toFixed(this[name]);
			} catch (e) {
				value = this[name];
			}
			this.getWidgetById(name).setValue(value);
		}
	},

	setAirportLatLng: function () {
		this._airportMarker.setLatLng([
			this.getWidgetById("airportLat").getValue(),
			this.getWidgetById("airportLng").getValue()
		]);
	},

	onMarkerDrag: function () {
		let latLng = this._airportMarker.getLatLng();
		this.getWidgetById("airportLat").setValue(latLng.lat.toFixed(5));
		this.getWidgetById("airportLng").setValue(latLng.lng.toFixed(5));
	},

	onNameChange: function () {
		let popup = document.createElement("div");
		L.ALS.Locales.localizeElement(popup, "airportForLayer", "innerText");
		popup.innerText += " " + this.getName();
		this._airportMarker.bindPopup(popup);
	}

})