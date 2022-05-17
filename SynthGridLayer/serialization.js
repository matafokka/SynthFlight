L.ALS.SynthGridLayer.prototype.serialize = function (seenObjects) {
	let serialized = this.getObjectToSerializeTo(seenObjects);

	serialized.polygons = [];

	// Gather selected polygons' coordinates

	for (let id in this.polygons) {
		let poly = this.polygons[id];

		serialized.polygons.push({
			polygon: poly.getBounds(),
			widget: poly.widgetable.serialize(seenObjects),
		});
	}

	this.clearSerializedPathsWidgets(serialized);
	return serialized;
}

L.ALS.SynthGridLayer.deserialize = function (serialized, layerSystem, settings, seenObjects) {
	let object = L.ALS.SynthBaseLayer.deserialize(serialized, layerSystem, settings, seenObjects);
	object.isAfterDeserialization = true;

	for (let struct of serialized.polygons) {
		let {polygon, widget} = struct,
			newPoly = new L.Rectangle(polygon),
			newWidget = L.ALS.LeafletLayers.WidgetLayer.deserialize(widget, seenObjects);

		newPoly.widgetable = newWidget;
		newWidget.polygon = newPoly;

		object.initPolygonStyleAndEvents(newPoly, true);
		object.widgetsGroup.addLayer(newWidget);
	}

	this.afterDeserialization(object);
	object._onMapPan();
	return object;
}