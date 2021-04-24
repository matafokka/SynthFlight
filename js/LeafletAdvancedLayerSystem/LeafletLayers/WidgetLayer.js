/**
 * A Widgetable that can be added to the map.
 *
 * Before using this class, set **map** option `keyboard` to `false`! If you don't do that, you'll encounter numerous problems. Do it when you create map, like this:
 *
 * ```JS
 * let map = L.map("map", { keyboard: false });
 * ```
 *
 * **Warning:** If you're targeting older browsers and adding only {@link L.ALS.Widgets.SimpleLabel} to this layer, you may want to use non-breaking hyphen (UTF-8 symbol) to prevent unnecessary word wrapping.
 *
 * **Warning:** If you want to use this only for labels, consider using {@link L.ALS.LeafletLayers.LabelLayer} since it's way faster than WidgetLayer.
 *
 * @param latLng {number[]|L.LatLng} Position of this object.
 * @param origin {"topLeft"|"topCenter"|"topRight"|"bottomLeft"|"bottomCenter"|"bottomRight"|"leftCenter"|"rightCenter"|"center"} Origin of this widget, i.e. which point of this widget will be placed at given latLng
 *
 * @class
 * @extends L.ALS.Widgetable
 * @mixes L.Marker
 *
 */
L.ALS.LeafletLayers.WidgetLayer =  L.ALS.Widgetable.extend( /** @lends L.ALS.LeafletLayers.WidgetLayer.prototype */ {

	includes: L.Marker.prototype,

	initialize: function (latLng = [52, 0], origin="center") {
		L.ALS.Widgetable.prototype.initialize.call(this, "als-divicon");
		L.Marker.prototype.initialize.call(this, latLng);

		this.setConstructorArguments(arguments);
		this.serializationIgnoreList.push("dragging", "_icon", "_latlng", "_shadow", "_zIndex", "_zoomAnimated");

		let divIcon = L.divIcon({
			iconSize: null,
			className: "als-divicon-container",
			html: this.container
		});
		L.Marker.prototype.setLatLng.call(this, latLng);
		L.Marker.prototype.setIcon.call(this, divIcon);
		this.setOrigin(origin);
	},

	addWidget: function (widget) {
		L.ALS.Widgetable.prototype.addWidget.call(this, widget);
		this._checkWidgets();
		return this;
	},

	removeWidget: function (id) {
		L.ALS.Widgetable.prototype.removeWidget.call(this, id);
		this._checkWidgets();
		return this;
	},

	removeAllWidgets: function () {
		L.ALS.Widgetable.prototype.removeAllWidgets.call(this);
		this._checkWidgets();
		return this;
	},

	/**
	 * Checks if this layer has one or multiple widgets. If there's only one widget, padding and borders will be removed.
	 * @private
	 */
	_checkWidgets: function () {
		let hasFirst = false, hasSecond = false;
		for (let prop in this._widgets) {
			if (!this._widgets.hasOwnProperty(prop))
				continue;
			if (!hasFirst)
				hasFirst = true;
			else if (hasFirst && !hasSecond)
				hasSecond = true;
			else if (hasFirst && hasSecond)
				break;
		}
		if (hasFirst && hasSecond)
			this.container.classList.remove("nostyle");
		else
			this.container.classList.add("nostyle");
	},

	/**
	 * Sets origin of this layer
	 * @param origin {"topLeft"|"topCenter"|"topRight"|"bottomLeft"|"bottomCenter"|"bottomRight"|"leftCenter"|"rightCenter"|"center"} Origin to set
	 * @return {L.ALS.LeafletLayers.WidgetLayer} This
	 */
	setOrigin: function (origin) {
		let baseName = "als-divicon-pos-";
		let names = ["topLeft", "topCenter", "topRight", "bottomLeft", "bottomCenter", "bottomRight", "leftCenter", "rightCenter", "center"];
		for (let name of names)
			this.container.classList.remove(baseName + name);
		this.container.classList.add(baseName + origin);
		return this;
	}

});

/**
 * Alias for {@link L.ALS.LeafletLayers.WidgetLayer}
 * @lends L.ALS.LeafletLayers.WidgetLayer
 */
L.WidgetLayer = L.ALS.LeafletLayers.WidgetLayer;