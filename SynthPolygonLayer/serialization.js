L.ALS.SynthPolygonLayer.prototype.serialize = function (seenObjects) {
	let serialized = this.getObjectToSerializeTo(seenObjects);

	serialized.polygonsWidgets = L.ALS.Serializable.serializeAnyObject(this.polygonsWidgets, seenObjects);
	serialized.polygons = {};

	// Gather selected polygons' coordinates
	for (let name in this.polygons) {
		if (!this.polygons.hasOwnProperty(name))
			continue;
		serialized.polygons[name] = this.polygons[name].getLatLngs();
	}
	return serialized;
}

L.ALS.SynthPolygonLayer._toUpdateColors = ["borderColor", "fillColor", "color0", "color1"];

L.ALS.SynthPolygonLayer.deserialize = function (serialized, layerSystem, settings, seenObjects) {
	let object = L.ALS.Layer.deserialize(serialized, layerSystem, settings, seenObjects);

	for (let prop in serialized.polygons)
		object.polygons[prop] = L.polygon(serialized.polygons[prop]);

	for (let prop in object.polygonsWidgets) {
		let widget = object.polygonsWidgets[prop];
		if (widget.addTo)
			object.widgetsGroup.addLayer(widget);
	}

	for (let color of this._toUpdateColors)
		object._setColor(object.getWidgetById(color));

	object.setAirportLatLng();
	object.updateAll();

	return object;
}