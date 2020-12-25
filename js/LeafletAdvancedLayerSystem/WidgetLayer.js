/**
 * A widgetable object that can be added to the map.
 *
 * Basically, it's a wrapper around L.DivIcon.
 *
 * Use getLayer() method to get an actual layer.
 *
 */
L.ALS.WidgetLayer =  L.ALS.Widgetable.extend({

	/**
	 * Constructs this class.
	 * @param latLng Position of this object.
	 * @param origin {"topLeft"|"topCenter"|"topRight"|"bottomLeft"|"bottomCenter"|"bottomRight"|"leftCenter"|"rightCenter"|"center"} Origin of this widget, i.e. which "part" of this widget will be at given latLng
	 */
	initialize: function (latLng = [52, 0], origin="center") {
		L.ALS.Widgetable.prototype.initialize.call(this, "adv-lyr-sys-divicon");
		let divIcon = L.divIcon({
			iconSize: null,
			className: "adv-lyr-sys-divicon-container",
			html: this.container
		});
		this.marker = L.marker(latLng, {icon: divIcon});
		this.setOrigin(origin);
	},

	/**
	 * Sets position of this object
	 * @param latLng
	 */
	setLatLng: function (latLng) {
		this.marker.setLatLng(latLng);
	},

	/**
	 * @return {*} Position of this object
	 */
	getLatLng: function () {
		return this.marker.getLatLng();
	},

	/**
	 * @return {L.Popup} An actual layer wrapped by this object
	 */
	getLayer: function () {
		return this.marker;
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

})