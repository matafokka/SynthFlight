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
	let shouldHide = distancePx < this.hidingThreshold;
	if (shouldHide) {
		let groups = ["polygonGroup", "bordersGroup", "labelsGroup", "widgetsGroup"];
		for (let group of groups)
			this[group].remove();
		this.isDisplayed = false;
	} else if (!shouldHide && !this.isDisplayed) {
		this.isDisplayed = true;
		this.polygonGroup.addTo(this.map); // Add removed stuff
		this.bordersGroup.addTo(this.map);
		this.labelsGroup.addTo(this.map);
	}

	shouldHide = distancePx < 200;
	if (this.isDisplayed && !this._doHidePolygonWidgets) {
		if (shouldHide)
			this.widgetsGroup.remove();
		else {
			this.widgetsGroup.addTo(this.map);
		}
	}
	this._onMapPan(); // Redraw polygons
}