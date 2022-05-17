L.ALS.SynthPolygonBaseLayer.prototype.serialize = function (seenObjects) {
	let serialized = this.getObjectToSerializeTo(seenObjects);

	serialized.polygons = [];
	serialized.polygonsWidgets = {};

	// Gather selected polygons' coordinates

	this.polygonGroup.eachLayer(poly => {
		if (poly.isCloned)
			return;

		let serializedPoly = poly[poly instanceof L.Rectangle ? "getBounds" : "getLatLngs"]();
		serializedPoly.widgetLinkId = L.ALS.Helpers.generateID();
		serialized.polygons.push(serializedPoly);

		if (!poly.widgetable)
			return;

		serialized.polygonsWidgets[serializedPoly.widgetLinkId] = poly.widgetable.serialize(seenObjects);
	});

	this.clearSerializedPathsWidgets(serialized);
	return serialized;
}

L.ALS.SynthPolygonBaseLayer._toUpdateColors = ["borderColor", "fillColor", "color0", "color1"];

L.ALS.SynthPolygonBaseLayer.deserialize = function (serialized, layerSystem, settings, seenObjects) {
	let object = L.ALS.SynthBaseLayer.deserialize(serialized, layerSystem, settings, seenObjects);
	object.isAfterDeserialization = true;

	for (let poly of serialized.polygons) {
		let newPoly = L[poly.serializableClassName === "L.LatLngBounds" ? "rectangle" : "polygon"](poly),
			widget = serialized.polygonsWidgets[poly.widgetLinkId];
		object.polygonGroup.addLayer(newPoly);

		if (!widget)
			continue;

		let newWidget = L.ALS.LeafletLayers.WidgetLayer.deserialize(widget, seenObjects);

		newPoly.widgetable = newWidget;
		newWidget.polygon = newPoly;

		object.widgetsGroup.addLayer(newWidget);
	}

	for (let color of this._toUpdateColors) {
		let widget = object.getWidgetById(color);
		if (widget)
			object.setColor(widget);
	}

	object.setAirportLatLng();
	object.calculateParameters();
	object.updatePolygonsColors();

	return object;
}