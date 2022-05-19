/**
 * Serializable button handler for getting mean height from min and max heights
 *
 * @class
 * @extends L.ALS.Serializable
 */
L.ALS.MeanHeightButtonHandler = L.ALS.Serializable.extend( /**@lends L.ALS.MeanHeightButtonHandler.prototype */ {

	initialize: function (widgetable) {
		this._widgetable = widgetable;
	},

	handle: function () {
		this._widgetable.getWidgetById("meanHeight").setValue(
			(this._widgetable.getWidgetById("minHeight").getValue() + this._widgetable.getWidgetById("maxHeight").getValue()) / 2
		);
	}
})

L.ALS.SynthPolygonBaseLayer.prototype.addPolygon = function (polygon, alignToCenter = false) {
	// Make polygon valid
	polygon.setStyle({fill: true});
	polygon.isValid = true;

	// Get anchor and anchor coordinates
	let anchorPoint, anchor;
	if (alignToCenter) {
		anchorPoint = polygon.getBounds().getCenter();
		anchor = "center";
	} else {
		anchorPoint = polygon.getLatLngs()[0][1];
		anchor = "topLeft";
	}

	if (polygon.widgetable) {
		polygon.widgetable.setLatLng(anchorPoint);
		return;
	}

	polygon.widgetable = new L.WidgetLayer(anchorPoint, anchor);
	polygon.widgetable.polygon = polygon;

	let handler = new L.ALS.MeanHeightButtonHandler(polygon.widgetable);

	if (this.useZoneNumbers)
		polygon.widgetable.addWidget(new L.ALS.Widgets.Number("zoneNumber", "zoneNumber", this, "calculatePolygonParameters").setMin(1).setValue(1));

	polygon.widgetable.addWidgets(
		new L.ALS.Widgets.Number("minHeight", "minHeight", this, "calculatePolygonParameters").setMin(1).setValue(1),
		new L.ALS.Widgets.Number("maxHeight", "maxHeight", this, "calculatePolygonParameters").setMin(1).setValue(1),
		new L.ALS.Widgets.Number("meanHeight", "meanHeight", this, "calculatePolygonParameters").setMin(1).setValue(1),
		new L.ALS.Widgets.Button("meanFromMinMax", "meanFromMinMax", handler, "handle"),
		new L.ALS.Widgets.ValueLabel("absoluteHeight", "absoluteHeight", "m"),
		new L.ALS.Widgets.ValueLabel("elevationDifference", "elevationDifference"),
		new L.ALS.Widgets.ValueLabel("reliefType", "reliefType"),
		new L.ALS.Widgets.SimpleLabel("error").setStyle("error"),
	);

	if (this.calculateCellSizeForPolygons) {
		polygon.widgetable.addWidgets(
			new L.ALS.Widgets.ValueLabel("lngCellSizeInMeters", "lngCellSizeInMeters", "m").setNumberOfDigitsAfterPoint(0),
			new L.ALS.Widgets.ValueLabel("latCellSizeInMeters", "latCellSizeInMeters", "m").setNumberOfDigitsAfterPoint(0),
		)
	}

	let toFormatNumbers = ["absoluteHeight", "elevationDifference", "lngCellSizeInMeters", "latCellSizeInMeters"];
	for (let id of toFormatNumbers) {
		let widget = polygon.widgetable.getWidgetById(id);
		if (widget)
			widget.setFormatNumbers(true);
	}

	this.widgetsGroup.addLayer(polygon.widgetable);

	if (polygon.linkedLayer)
		polygon.linkedLayer.setStyle(polygon.options);
}

/**
 * Removes polygon, its widget and linked polygon from the map
 * @param polygon {L.Layer} Polygon to remove
 */
L.ALS.SynthPolygonBaseLayer.prototype.removePolygon = function (polygon) {
	for (let layer of [polygon, polygon.linkedLayer]) {
		if (!layer)
			continue;

		this.polygonGroup.removeLayer(layer);
		if (!layer.widgetable)
			continue;

		this._removePolygonWidget(layer);
	}
}

L.ALS.SynthPolygonBaseLayer.prototype.invalidatePolygon = function (polygon) {
	for (let layer of [polygon, polygon.linkedLayer]) {
		if (!layer)
			continue;

		layer.setStyle({color: "red", fillColor: "red"});
		layer.isValid = false;

		this._removePolygonWidget(layer);
	}
}

L.ALS.SynthPolygonBaseLayer.prototype._removePolygonWidget = function (polygon) {
	if (!polygon.widgetable)
		return;

	this.widgetsGroup.removeLayer(polygon.widgetable);
	polygon.widgetable.remove();
	delete polygon.widgetable;
}

/**
 * Removes widgets that are hanging on the map after polygons have been removed
 */
L.ALS.SynthPolygonBaseLayer.prototype.removeLeftoverWidgets = function () {
	this.widgetsGroup.eachLayer(layer => {
		if (layer.polygon && !this.polygonGroup.hasLayer(layer.polygon))
			this.widgetsGroup.removeLayer(layer);
	});
}

L.ALS.SynthPolygonBaseLayer.prototype.afterEditEnd = function (invalidLayersMessage, layersInvalidated, e = undefined, shouldJustReturn = false) {
	this.notifyAfterEditing(invalidLayersMessage, layersInvalidated, e, shouldJustReturn);

	this.removeLeftoverWidgets();
	this.map.addLayer(this.labelsGroup); // Nothing in the base layer hides or shows it, so it's only hidden in code above
	this.updatePolygonsColors();
	this.calculatePolygonParameters();
	this.updatePathsMeta();
	this.updateLayersVisibility();
	this.writeToHistoryDebounced();
}

L.ALS.SynthPolygonBaseLayer.prototype.calculatePolygonParameters = function () {
	this.forEachValidPolygon(layer => {

		let latLngs = layer.getLatLngs()[0];

		if (this.calculateCellSizeForPolygons) {
			layer.lngCellSizeInMeters = this.getParallelOrMeridianLineLength(latLngs[0], latLngs[1], false);
			layer.latCellSizeInMeters = this.getParallelOrMeridianLineLength(latLngs[1], latLngs[2], false);

			layer.widgetable.getWidgetById("lngCellSizeInMeters").setValue(layer.lngCellSizeInMeters);
			layer.widgetable.getWidgetById("latCellSizeInMeters").setValue(layer.latCellSizeInMeters);
		}

		layer.minHeight = layer.widgetable.getWidgetById("minHeight").getValue();
		layer.maxHeight = layer.widgetable.getWidgetById("maxHeight").getValue();

		let errorLabel = layer.widgetable.getWidgetById("error");
		if (layer.minHeight > layer.maxHeight) {
			errorLabel.setValue("errorMinHeightBiggerThanMaxHeight");
			return;
		}
		errorLabel.setValue("");

		layer.meanHeight = layer.widgetable.getWidgetById("meanHeight").getValue();
		layer.absoluteHeight = this["flightHeight"] + layer.meanHeight;

		layer.elevationDifference = (layer.maxHeight - layer.minHeight) / this["flightHeight"];
		layer.reliefType = (layer.elevationDifference >= 0.2) ? "Variable" : "Plain";

		let names = ["meanHeight", "absoluteHeight", "elevationDifference", "reliefType"];
		for (let name of names) {
			let value;
			try {
				value = this.toFixed(layer[name]);
			} catch (e) {
				value = layer[name];
			}
			layer.widgetable.getWidgetById(name).setValue(value);
		}
	})
}

L.ALS.SynthPolygonBaseLayer.prototype.forEachValidPolygon = function (cb) {
	this.polygonGroup.eachLayer(poly => {
		if (!poly.isCloned && poly.isValid)
			cb(poly);
	})
}

L.ALS.SynthPolygonBaseLayer.prototype._getRectOrPolyCoords = function (layer) {
	if (layer instanceof L.Rectangle) {
		let {_northEast, _southWest} = layer.getBounds();
		return [_northEast, _southWest];
	}
	return layer.getLatLngs()[0];
}

L.ALS.SynthPolygonBaseLayer.prototype._setRectOrPolyCoords = function (layer, coords) {
	if (layer instanceof L.Rectangle)
		layer.setBounds(coords);
	else
		layer.setLatLngs(coords);
}

L.ALS.SynthPolygonBaseLayer.prototype.cloneLayerIfNeeded = function (layer) {
	// Clone layers that crosses antimeridians
	let bounds = layer.getBounds(),
		crossingWest = bounds.getWest() < -180,
		crossingEast = bounds.getEast() > 180,
		crossingOne = crossingWest || crossingEast,
		crossingBoth = crossingEast && crossingWest

	if (!layer.linkedLayer && crossingOne && !crossingBoth) {
		let clonedLayer = layer instanceof L.Rectangle ? L.rectangle(bounds) : new L.Polygon([]),
			moveTo = crossingWest ? 1 : -1,
			setLinkedLatLngs = (editedLayer) => {
				let latlngs = this._getRectOrPolyCoords(editedLayer), newLatLngs = [];

				for (let coord of latlngs)
					newLatLngs.push([coord.lat, coord.lng + (editedLayer.linkedLayer.isCloned ? 1 : -1) * moveTo * 360]);

				this._setRectOrPolyCoords(editedLayer.linkedLayer, newLatLngs);
			}

		clonedLayer.isCloned = true;
		clonedLayer.linkedLayer = layer;
		layer.linkedLayer = clonedLayer;
		this.polygonGroup.addLayer(clonedLayer);

		for (let lyr of [layer, clonedLayer]) {
			let editHandler = () => {
				setLinkedLatLngs(lyr);
				lyr.linkedLayer.editing.updateMarkers();
			}

			lyr.on("editdrag", editHandler);
			lyr.editHandler = editHandler;
		}

		setLinkedLatLngs(layer);
	} else if (layer.linkedLayer && (!crossingOne || crossingBoth)) {
		layer.off("editdrag", layer.editHandler);
		this.polygonGroup.removeLayer(layer.linkedLayer);
		delete layer.editHandler;
		delete layer.linkedLayer;
	}
}