/**
 * Base class for all classes that can have widgets.
 *
 * Has property `container` which is container for the widgets. Add it to the page.
 * @class
 * @extends L.ALS.Serializable
 *
 * @param className {string} Class name for the container
 */
L.ALS.Widgetable = L.ALS.Serializable.extend( /** @lends L.ALS.Widgetable.prototype */ {

	/** @constructs */
	initialize: function (className = "") {
		L.ALS.Serializable.prototype.initialize.call(this, className);
		this.setConstructorArguments(arguments);

		/**
		 * Container to add widgets to
		 * @type {HTMLDivElement}
		 */
		this.container = document.createElement("div");
		if (className !== "")
			this.container.className = className;

		/**
		 * Maps widgets' IDs to widgets themselves
		 * @type {Object<string, L.ALS.Widgets.BaseWidget>}
		 * @private
		 */
		this._widgets = {}
	},

	/**
	 * Adds widget to the container
	 * @param widget {L.ALS.Widgets.BaseWidget} Widget to add
	 */
	addWidget: function (widget) {
		this.container.appendChild(widget.getContainer());
		this._widgets[widget.getId()] = widget;
	},

	/**
	 * Removes widget from the container
	 * @param id {string} ID of a widget to remove
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
	 * Finds widget by ID
	 * @param id {string} ID of a control to find
	 * @return {L.ALS.Widgets.BaseWidget} Widget with given ID.
	 */
	getWidgetById: function(id) {
		return this._widgets[id];
	},

	/**
	 * Serializes widgets. Use this if you want to serialize only widgets in your own Widgetable.
	 * @param seenObjects {Object} Already seen objects' ids. Intended only for internal use.
	 * @return {Object} Object where keys are widget's ids and values are serialized widgets themselves
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
	 * @param seenObjects {Object} Already seen objects' ids. Intended only for internal use.
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