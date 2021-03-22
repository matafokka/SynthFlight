/**
 * A Widgetable that can be added to the map. Extends both Widgetable and L.Marker.
 *
 * Before using this class, set **map** option `keyboard` to `false`! If you don't do that, you'll encounter problems.
 *
 * ***Warning:*** *If you're targeting older browsers and adding only SimpleLabel to this widgetable, you may want to use non-breaking hyphen to prevent unnecessary word wrapping.*
 *
 * ***Warning:*** *If you want to use this only for labels, consider using L.ALS.LeafletLayers.LabelLayer since it's way faster than WidgetLayer.*
 *
 */
L.ALS.LeafletLayers.WidgetLayer =  L.ALS.Widgetable.extend({

	includes: L.Marker.prototype,

	/**
	 * Constructs this class.
	 * @param latLng Position of this object.
	 * @param origin {"topLeft"|"topCenter"|"topRight"|"bottomLeft"|"bottomCenter"|"bottomRight"|"leftCenter"|"rightCenter"|"center"} Origin of this widget, i.e. which "part" of this widget will be at given latLng
	 */
	initialize: function (latLng = [52, 0], origin="center") {
		L.ALS.Widgetable.prototype.initialize.call(this, "adv-lyr-sys-divicon");
		L.Marker.prototype.initialize.call(this, latLng);

		this.setConstructorArguments(arguments);
		this.serializationIgnoreList.push("dragging", "_icon", "_latlng", "_shadow", "_zIndex", "_zoomAnimated");

		let divIcon = L.divIcon({
			iconSize: null,
			className: "adv-lyr-sys-divicon-container",
			html: this.container
		});
		L.Marker.prototype.setLatLng.call(this, latLng);
		L.Marker.prototype.setIcon.call(this, divIcon);
		this.setOrigin(origin);
	},

	addWidget: function (widget) {
		L.ALS.Widgetable.prototype.addWidget.call(this, widget);
		this._checkWidgets();
	},

	removeWidget: function (id) {
		L.ALS.Widgetable.prototype.removeWidget.call(this, id);
		this._checkWidgets();
	},

	removeAllWidgets: function () {
		L.ALS.Widgetable.prototype.removeAllWidgets.call(this);
		this._checkWidgets();
	},

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
	 */
	setOrigin: function (origin) {
		let baseName = "adv-lyr-sys-divicon-pos-";
		let names = ["topLeft", "topCenter", "topRight", "bottomLeft", "bottomCenter", "bottomRight", "leftCenter", "rightCenter", "center"];
		for (let name of names)
			this.container.classList.remove(baseName + name);
		this.container.classList.add(baseName + origin);
	}

});

L.WidgetLayer = L.ALS.LeafletLayers.WidgetLayer;