const turfHelpers = require("@turf/helpers");

L.ALS.SynthBaseLayer.prototype.calculateParameters = function () {

	let parameters = ["cameraWidth", "cameraHeight", "pixelWidth", "focalLength", "imageScale", "overlayBetweenPaths", "overlayBetweenImages", "aircraftSpeed"];
	for (let param of parameters)
		this[param] = this.getWidgetById(param)?.getValue();
	this.flightHeight = this["imageScale"] * this["focalLength"];

	let cameraParametersWarning = this.getWidgetById("cameraParametersWarning");
	if (this["cameraHeight"] > this["cameraWidth"])
		cameraParametersWarning.setValue("errorCamHeight");
	else
		cameraParametersWarning.setValue("");

	let pixelWidth = this["pixelWidth"] * 1e-6;
	let focalLength = this["focalLength"] * 0.001;

	if (this.hasYOverlay) {
		this.ly = this["cameraWidth"] * pixelWidth; // Image size in meters
		this.Ly = this.ly * this["imageScale"] // Image width on the ground
		this.By = this.Ly * (100 - this["overlayBetweenPaths"]) / 100; // Distance between paths
	}

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
		const field = this[name];
		if (field === undefined)
			continue;

		let value;
		try {
			value = this.toFixed(field);
		} catch (e) {
			value = field;
		}
		this.getWidgetById(name).setValue(value);
	}

}