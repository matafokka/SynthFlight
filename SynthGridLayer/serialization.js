L.ALS.SynthGridLayer.prototype.serialize = function (seenObjects) {
	let serialized = this.getObjectToSerializeTo(seenObjects);

	serialized.selectedPolygonsWidgets = L.ALS.Serializable.serializeAnyObject(this.selectedPolygonsWidgets, seenObjects);
	serialized.selectedPolygons = {};

	// Gather selected polygons' coordinates
	for (let name in this.selectedPolygons) {
		if (!this.selectedPolygons.hasOwnProperty(name))
			continue;
		serialized.selectedPolygons[name] = this.selectedPolygons[name].getLatLngs();
	}
	return serialized;
}

L.ALS.SynthGridLayer._toUpdateColors = ["gridBorderColor", "gridFillColor", "meridiansColor", "parallelsColor"];

L.ALS.SynthGridLayer.deserialize = function (serialized, layerSystem, settings, seenObjects) {
	let object = L.ALS.Layer.deserialize(serialized, layerSystem, settings, seenObjects);

	for (let prop in serialized.selectedPolygons)
		object.selectedPolygons[prop] = L.polygon(serialized.selectedPolygons[prop]);

	for (let prop in object.selectedPolygonsWidgets) {
		let widget = object.selectedPolygonsWidgets[prop];
		if (widget.addTo)
			object.widgetsGroup.addLayer(widget);
	}

	for (let color of this._toUpdateColors)
		object._setColor(object.getWidgetById(color));

	object.setAirportLatLng();
	object.updateGrid();

	return object;
}