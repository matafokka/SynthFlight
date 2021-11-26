/**
 * Hides grid when zoom is too low. Also optimizes performance.
 * @private
 */
L.ALS.SynthGridLayer.prototype._onMapZoom = function () {
	if (!this.isShown)
		return;

	// Let's calculate how much pixels will be in given distance
	// We'll account only latitude for simplicity.
	let topLeft = this.map.getBounds().getNorthWest();
	let distanceLatLng = L.latLng(topLeft.lat, topLeft.lng + this.lngDistance);
	let distancePx = this.map.latLngToContainerPoint(distanceLatLng).x;

	// Grid becomes messy when distance is around 15 pixels

	/**
	 * Whether should hide stuff, if map is zoomed out
	 * @type {boolean}
	 * @private
	 */
	this._shouldHideEverything = distancePx < this.hidingThreshold;

	if (this._shouldHideEverything) {
		let groups = ["polygonGroup", "bordersGroup", "labelsGroup", "widgetsGroup"];
		for (let group of groups)
			this[group].remove();
		this.isDisplayed = false;
	} else if (!this._shouldHideEverything && !this.isDisplayed) {
		this.isDisplayed = true;
		this.polygonGroup.addTo(this.map); // Add removed stuff
		this.bordersGroup.addTo(this.map);
		this.labelsGroup.addTo(this.map);
	}

	this._shouldHideEverything = distancePx < 200;
	if (this.isDisplayed && !this._doHidePolygonWidgets) {
		if (this._shouldHideEverything)
			this.widgetsGroup.remove();
		else {
			this.widgetsGroup.addTo(this.map);
		}
	}
	this._onMapPan(); // Redraw polygons
}