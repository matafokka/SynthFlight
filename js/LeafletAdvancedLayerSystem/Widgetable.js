/**
 * Base class for all classes that can have widgets.
 *
 * Has property `container` which is container for the widgets. Add it to the page.
 *
 * See {@link L.ALS.Widgets} docs for the example on working with Widgetables and Widgets.
 *
 * @param className {string} Class name for the container
 *
 * @class
 * @extends L.ALS.Serializable
 *
 */
L.ALS.Widgetable = L.ALS.Serializable.extend( /** @lends L.ALS.Widgetable.prototype */ {

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
	 * Adds widget to this widgetable
	 * @param widget {L.ALS.Widgets.BaseWidget} Widget to add
	 * @return {L.ALS.Widgetable} This
	 */
	addWidget: function (widget) {
		this.container.appendChild(widget.getContainer());
		this._widgets[widget.id] = widget;
		widget._isAdded = true;
		return this;
	},

	/**
	 * Adds all widgets to this widgetable
	 * @param widgets {L.ALS.Widgets.BaseWidget} Widgets to add
	 * @return {L.ALS.Widgetable} This
	 */
	addWidgets: function (...widgets) {
		for (let widget of widgets)
			this.addWidget(widget);
		return this;
	},

	/**
	 * Removes widget from the container
	 * @param id {string} ID of a widget to remove
	 * @return {L.ALS.Widgetable} This
	 */
	removeWidget: function (id) {
		let container = this._widgets[id].getContainer();
		container.parentNode.removeChild(container);
		delete this._widgets[id];
		this._widgets[id]._isAdded = false;
		return this;
	},

	/**
	 * Removes all widgets from the container
	 * @return {L.ALS.Widgetable} This
	 */
	removeAllWidgets: function () {
		while (this.container.hasChildNodes())
			this.container.removeChild(this.container.firstChild);
		this._widgets = {};
		return this;
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

		/**
		 * @see L.ALS.Serializable.deserialize
		 * @override
		 * @inheritDoc
		 * @memberOf L.ALS.Widgetable
		 */
		deserialize: function (serialized, seenObjects) {
			let obj = this.getObjectFromSerialized(serialized, seenObjects);
			obj.deserializeWidgets(serialized._widgets, seenObjects);
			return obj;
		},
	}

});