L.ALS.SynthPolygonBaseLayer.prototype.serialize = function (seenObjects) {
	let serialized = this.getObjectToSerializeTo(seenObjects);

	serialized.polygonsWidgets = L.ALS.Serializable.serializeAnyObject(this.polygonsWidgets, seenObjects);

	// Gather selected polygons' coordinates

	for (let objName of ["polygons", "invalidPolygons"]) {
		let polyObject = this[objName];
		serialized[objName] = {};

		for (let name in polyObject) {
			if (!polyObject.hasOwnProperty(name))
				continue;

			let poly = polyObject[name];
			serialized[objName][name] = poly[poly instanceof L.Rectangle ? "getBounds" : "getLatLngs"]();
		}
	}

	this.clearSerializedPathsWidgets(serialized);
	return serialized;
}

L.ALS.SynthPolygonBaseLayer._toUpdateColors = ["borderColor", "fillColor", "color0", "color1"];

L.ALS.SynthPolygonBaseLayer.deserialize = function (serialized, layerSystem, settings, seenObjects) {
	let object = L.ALS.SynthBaseLayer.deserialize(serialized, layerSystem, settings, seenObjects);
	object.isAfterDeserialization = true;

	for (let objName of ["polygons", "invalidPolygons"]) {
		let serializedPolyObj = serialized[objName],
			deserializedPolyObj = object[objName];

		for (let prop in serializedPolyObj) {
			if (!serializedPolyObj.hasOwnProperty(prop))
				continue;

			let value = serializedPolyObj[prop],
				newPoly = L[value.serializableClassName === "L.LatLngBounds" ? "rectangle" : "polygon"](value);

			if (objName === "invalidPolygons")
				object.invalidatePolygon(newPoly)
			else
				deserializedPolyObj[prop] = newPoly;

			object.polygonGroup.addLayer(newPoly);
		}
	}

	for (let prop in object.polygonsWidgets) {
		let widget = object.polygonsWidgets[prop];
		if (widget.addTo)
			object.widgetsGroup.addLayer(widget);
	}

	for (let color of this._toUpdateColors)
		object.setColor(object.getWidgetById(color));

	object.setAirportLatLng();
	object.calculateParameters();
	object.updatePolygonsColors();

	return object;
}