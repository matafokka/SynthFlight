const turfHelpers = require("@turf/helpers");

L.ALS.SynthGridLayer.prototype.calculateParameters = function () {
	L.ALS.SynthBaseLayer.prototype.calculateParameters.call(this);

	let latLngs = ["lat", "lng"];

	for (let name of latLngs) {
		let sizeName = name + "CellSizeInMeters", countName = name + "PathsCount";

		let cellSize = Math.round(turfHelpers.radiansToLength(turfHelpers.degreesToRadians(this[name + "Distance"]), "meters"));
		let pathsCount = Math.ceil(cellSize / this.By);
		this[sizeName] = cellSize;
		this[countName] = pathsCount;

		this.getWidgetById(sizeName).setValue(this.toFixed(cellSize));
		this.getWidgetById(countName).setValue(pathsCount);
	}
	this._calculatePolygonParameters();
}