L.ALS.SynthPolygonLayer.prototype.serialize = function (seenObjects) {
	let serialized = this.getObjectToSerializeTo(seenObjects);

	serialized.polygonsWidgets = L.ALS.Serializable.serializeAnyObject(this.polygonsWidgets, seenObjects);
	serialized.polygons = {};

	// Gather selected polygons' coordinates
	for (let name in this.polygons) {
		if (!this.polygons.hasOwnProperty(name))
			continue;
		let poly = this.polygons[name];
		serialized.polygons[name] = poly[poly instanceof L.Rectangle ? "getBounds" : "getLatLngs"]();
	}

	this.clearSerializedPathsWidgets(serialized);
	return serialized;
}

L.ALS.SynthPolygonLayer._toUpdateColors = ["borderColor", "fillColor", "color0", "color1"];

L.ALS.SynthPolygonLayer.deserialize = function (serialized, layerSystem, settings, seenObjects) {
	let object = L.ALS.Layer.deserialize(serialized, layerSystem, settings, seenObjects);
	object.isAfterDeserialization = true;

	for (let prop in serialized.polygons) {
		let value = serialized.polygons[prop];
		object.polygons[prop] = L[value.serializableClassName === "L.LatLngBounds" ? "rectangle" : "polygon"](value);
	}

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