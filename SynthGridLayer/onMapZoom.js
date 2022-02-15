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
		this.hideOrShowGroups(true);
		this.isDisplayed = false;
	} else if (!this._shouldHideEverything && !this.isDisplayed) {
		this.isDisplayed = true;
		this.hideOrShowGroups(false);
	}

	this._shouldHideEverything = distancePx < 200;
	this.hideOrShowLayer(this._doHidePolygonWidgets || this._shouldHideEverything, this.widgetsGroup);

	this._onMapPan(); // Redraw polygons
}

L.ALS.SynthGridLayer.prototype.hideOrShowGroups = function (hide) {
	let groups = [this.polygonGroup, this.bordersGroup, this.labelsGroup];

	for (let group of groups)
		this.hideOrShowLayer(hide, group);
}