/**
 * Base class for all classes that can have widgets.
 * @type {Widgetable}
 */
L.ALS.Widgetable = L.ALS.Serializable.extend({

	/**
	 * Initializes this object.
	 * @param className {string} Class name for the container
	 */
	initialize: function (className = "") {
		L.ALS.Serializable.prototype.initialize.call(this, className);
		this.setConstructorArguments(arguments);

		this.container = document.createElement("div");
		if (className !== "")
			this.container.className = className;
		this._widgets = {}
	},

	/**
	 * Adds widget to the container
	 * @param widget Control to add
	 */
	addWidget: function (widget) {
		this.container.appendChild(widget.container);
		this._widgets[widget.id] = widget;
	},

	/**
	 * Removes widget from the container
	 * @param id
	 */
	removeWidget: function (id) {
		let container = this._widgets[id].getContainer();
		container.parentNode.removeChild(container);
		delete this._widgets[id];
	},

	/**
	 * Removes all widgets from the container
	 */
	removeAllWidgets: function () {
		while (this.container.hasChildNodes())
			this.container.removeChild(this.container.firstChild);
		this._widgets = {};
	},

	/**
	 * Finds control for this layer by id
	 * @param id id of a control to find
	 * @return {HTMLInputElement} Control with given id.
	 */
	getWidgetById: function(id) {
		return this._widgets[id];
	},

	/**
	 * Serializes widgets. Use this if you want to serialize only widgets in your own Widgetable.
	 * @param seenObjects Already seen objects' ids. Intended only for internal use.
	 * @return {{}} Object where keys are widget's ids and values are serialized widgets themselves
	 */
	serializeWidgets: function (seenObjects) {
		let json = {};
		for (let prop in this._widgets) {
			if (this._widgets.hasOwnProperty(prop) && this._widgets[prop].serialize)
				json[prop] = this._widgets[prop].serialize(seenObjects);
		}
		return json;
	},

	/**
	 * Deserializes widgets and adds them to this object. Removes all previously added widgets. Use this if you want to deserialize only widgets in your own Widgetable.
	 * @param serializedWidgets {Object} Result of `serializedWidgets()`
	 * @param seenObjects Already seen objects' ids. Intended only for internal use.
	 */
	deserializeWidgets: function (serializedWidgets, seenObjects) {
		this.removeAllWidgets();
		for (let prop in serializedWidgets) {
			let widgetJson = serializedWidgets[prop];
			if (!widgetJson.serializableClassName)
				continue;
			let widget = L.ALS.Serializable.deserialize({w: widgetJson}, seenObjects).w;
			this.addWidget(widget);
		}
	},

	statics: {
		deserialize: function (serialized, seenObjects) {
			let obj = this.getObjectFromSerialized(serialized, seenObjects);
			obj.deserializeWidgets(serialized._widgets, seenObjects);
			return obj;
		},
	}

});