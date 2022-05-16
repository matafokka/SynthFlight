const debounce = require("debounce");

/**
 * Enables L.Draw on this layer
 * @param drawControls {Object} L.Draw controls to use
 * @param drawingGroup {L.FeatureGroup} Group to pass to L.Draw
 */
L.ALS.SynthBaseLayer.prototype.enableDraw = function (drawControls, drawingGroup) {

	/**
	 * Leaflet.Draw controls to use
	 */
	this.drawControls = drawControls;

	this._drawingGroup = drawingGroup;

	this._drawTypes = ["circle", "circlemarker", "marker", "polygon", "polyline", "rectangle", "simpleshape"];

	this._drawOptions = {
		draw: {},
		edit: {
			featureGroup: this._drawingGroup,
			remove: true,
		}
	}

	this.onEditEndDebounced = debounce((notifyIfLayersSkipped = false) => this.onEditEnd(undefined, notifyIfLayersSkipped), 300); // Math operations are too slow for immediate update

	for (let control of this._drawTypes)
		this._drawOptions.draw[control] = false;

	for (let control in this.drawControls)
		this._drawOptions.draw[control] = this.drawControls[control];

	this.drawControl = new L.Control.Draw(this._drawOptions);

	this.updateDrawThickness();
	this.addEventListenerTo(this.map, "draw:created", "onDraw");
	this.addEventListenerTo(this.map, "draw:drawstart draw:editstart draw:deletestart", "onEditStart");
	this.addEventListenerTo(this.map, "draw:drawstop draw:editstop draw:deletestop", "onEditEnd");
	let addDrawControl = () => this.addControl(this.drawControl, "top", "follow-menu");
	addDrawControl();

	document.body.addEventListener("synthflight-locale-changed", () => {
		this.removeControl(this.drawControl);
		addDrawControl();
	});
}

L.ALS.SynthBaseLayer.prototype.onDraw = function (e) {
	if (!this.isSelected)
		return;

	// Don't add layers of size less than 3x3 px and don't add geodesics with one point
	if (e.layer instanceof L.Geodesic && e.layer.getLatLngs().length < 2)
		return;

	if (e.layer.getBounds) {
		let {_northEast, _southWest} = e.layer.getBounds(),
			zoom = this.map.getZoom(),
			min = this.map.project(_northEast, zoom),
			max = this.map.project(_southWest, zoom);

		if (Math.abs(max.x - min.x) <= 3 && Math.abs(max.y - min.y) <= 3)
			return;
	}

	this._drawingGroup.addLayer(e.layer);

	let borderColorId, fillColor;

	if (e.layer instanceof L.Polygon || e.layer instanceof L.CircleMarker || e.layer instanceof L.Marker) {
		borderColorId = "borderColor";
		fillColor = this.getWidgetById("fillColor").getValue();
	} else {
		borderColorId = "color0";
		fillColor = "transparent";
	}

	e.layer.setStyle({color: this.getWidgetById(borderColorId).getValue(), fillColor, opacity: 1});
}

L.ALS.SynthBaseLayer.prototype.onEditStart = function () {}
L.ALS.SynthBaseLayer.prototype.onEditEnd = function () {}

L.ALS.SynthBaseLayer.prototype.updateDrawThickness = function () {
	for (let type of this._drawTypes) {
		try {
			this._drawOptions.draw[type].shapeOptions.weight = this.lineThicknessValue;
		} catch (e) {}
	}
}