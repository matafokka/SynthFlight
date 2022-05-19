L.ALS.SynthPolygonBaseLayer.prototype.serialize = function (seenObjects) {
	let serialized = this.getObjectToSerializeTo(seenObjects);

	serialized.polygons = [];

	// Gather selected polygons' coordinates

	this.polygonGroup.eachLayer(poly => {
		if (poly.isCloned)
			return;

		let serializedPoly = poly instanceof L.Rectangle ? this.serializeRect(poly) : poly.getLatLngs(),
			serializedStruct = {polygon: serializedPoly}
		serialized.polygons.push(serializedStruct);

		if (!poly.widgetable)
			return;

		serializedStruct.widget = poly.widgetable.serialize(seenObjects);
	});

	return serialized;
}

L.ALS.SynthPolygonBaseLayer.prototype.serializeRect = function (rect) {
	let {_northEast, _southWest} = rect.getBounds();
	return [[_northEast.lat, _northEast.lng], [_southWest.lat, _southWest.lng]];
}

L.ALS.SynthPolygonBaseLayer._toUpdateColors = ["borderColor", "fillColor", "color0", "color1"];

L.ALS.SynthPolygonBaseLayer.deserialize = function (serialized, layerSystem, settings, seenObjects) {
	let object = L.ALS.SynthBaseLayer.deserialize(serialized, layerSystem, settings, seenObjects);
	object.isAfterDeserialization = true;

	for (let struct of serialized.polygons) {
		let {polygon, widget} = struct,
			newPoly = new L[polygon.length === 2 ? "Rectangle" : "Polygon"](polygon);
		object.polygonGroup.addLayer(newPoly);

		if (!widget)
			continue;

		let newWidget = L.ALS.LeafletLayers.WidgetLayer.deserialize(widget, seenObjects);

		newPoly.widgetable = newWidget;
		newWidget.polygon = newPoly;

		object.widgetsGroup.addLayer(newWidget);
	}

	this.afterDeserialization(object);
	return object;
}

L.ALS.SynthPolygonBaseLayer.afterDeserialization = function (deserialized) {
	for (let color of this._toUpdateColors) {
		let widget = deserialized.getWidgetById(color);
		if (widget)
			deserialized.setColor(widget);
	}

	deserialized.setAirportLatLng();
	deserialized.calculateParameters();
	deserialized.updatePolygonsColors();
}