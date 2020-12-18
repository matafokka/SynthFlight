const generateID = require("./generateID.js");
require("./Widgetable.js");
require("./widgets/Widgets.js");

/**
 * Base class for all layers for LeafletAdvancedLayerSystem.
 *
 * Basically, it's a wrapper around FeatureGroup. It doesn't provide all of it's methods because they're used internally in the layer system, and their usage will break it. So do NOT touch the actual FeatureGroup object.
 *
 * Usage:
 *
 * 0. Set defaultName property to the default name of your layer.
 *
 * 1. Assign statics.wizard object to an instance of your wizard.
 *
 * 2. Implement init() method. It's used instead of a constructor.
 *
 * 3. Implement your own methods or extend current ones. Basically, make it work :D
 *
 * Please, read the docs on each public method, you might need to (if not should) override most of them.
 *
 * Some usage notes:
 *
 * 1. Use addLayer() and removeLayers() to add and remove layers. To hide layer from the map, use this.map.remove() and this.map.add().
 * 2. Use addEventListenerTo() and removeEventListenerFrom() to add and remove event listeners from objects and map
 * 3. NEVER use L.LayerGroup because it breaks layer system! Use L.FeatureGroup instead.
 *
 * @type {Layer}
 */
L.ALS.Layer = L.ALS.Widgetable.extend({
	/**
	 * Name to be assigned to this layer by default
	 * @type {string}
	 * @public
	 */
	defaultName: "Advanced Layer",

	/**
	 * Indicates whether this layer is shown or not. Should not be modified!
	 * @type {boolean}
	 * @public
	 */
	isShown: true,

	/**
	 * Indicates whether this layer is selected or not. Should not be modified!
	 * @type {boolean}
	 */
	isSelected: false,

	/**
	 * SynthLayer's constructor. Do NOT override it! Use init() method instead!
	 * @param map Leaflet map to display layer on
	 * @param layerSystem Layer system that creates this layer
	 */
	initialize: function(map, layerSystem) {
		L.ALS.Widgetable.prototype.initialize.call(this, "layer-menu");
		/**
		 * Contains event listeners bound to various objects. Looks like this:
		 * ```
		 * {
		 *     "object_id_1": {
		 *         "event_type_1": ["handler1", "handler2", ...],
		 *         "event_type_2": [...],
		 *         ...
		 *     },
		 *     "object_id_2": { ... },
		 *     ...
		 * }
		 * ```
		 */
		this._eventsForObjects = {};

		this._mapEvents = [];

		this.map = map;
		this.id = "SynthLayer" + generateID();
		this.layers = L.featureGroup();
		this._layerSystem = layerSystem;
		this.name = this.defaultName;
	},

	/**
	 * Adds event listener (handler) to the object. Use it instead of object.on().
	 *
	 * Note: we use object's methods as handlers to be able to save and restore them when user saves the project.
	 *
	 * @param object Object to add listener to
	 * @param type {string} Event type, string in format used by Leaflet
	 * @param handler {string} Your object's method that will handle this event
	 */
	addEventListenerTo: function (object, type, handler) {
		// Write added event listener to the _eventsForObjects
		if (object._advSysID === undefined)
			object._advSysID = "advLayerSys" + generateID();
		if (this._eventsForObjects[object._advSysID] === undefined)
			this._eventsForObjects[object._advSysID] = {};
		if (this._eventsForObjects[object._advSysID][type] === undefined)
			this._eventsForObjects[object._advSysID][type] = [];

		let handlerFunction = (event) => {
			let callHandler = (event) => {
				this[handler](event);
				this._layerSystem._reorderLayers();
			}

			// Always fire map events
			if (object === this.map) {
				callHandler(event);
				return;
			}

			if (!this.isShown) // Events won't be fired if this layer is hidden
				return;

			if (this.isSelected) { // Events will be only fired when this layer is selected
				callHandler(event);
				return;
			}
			this._layerSystem._passEvent(event); // Otherwise event will pass to the underlying layer
		}

		let handlerObject = {
			type: type,
			handler: handler,
			handlerFunction: handlerFunction
		}

		this._eventsForObjects[object._advSysID][type].push(handlerObject);
		object.on(type, handlerFunction);

		if (object === this.map)
			this._mapEvents.push(handlerObject);
	},

	/**
	 * Removes event listener (handler) to the specified event type from the object. Use it instead object.off().
	 *
	 * @see AdvancedLayer.addEventListenerTo For more information
	 *
	 * @param object {object} - Object to remove event listener from
	 * @param type {string} - Event type
	 * @param handler {string} - Event listener (handler) to remove
	 */
	removeEventListenerFrom: function (object, type, handler) {
		if (object._advSysID === undefined)
			return;
		let handlers = this._eventsForObjects[object._advSysID][type];
		if (handlers === undefined)
			return;

		let index = -1;
		for (let i = 0; i < handlers.length; i++) {
			if (handlers[i].handler === handler) {
				index = i;
				break;
			}
		}
		if (index === -1)
			return;

		let handlerObject = handlers[index];

		if (object === this.map)
			this._mapEvents.splice(this._mapEvents.indexOf(handlerObject), 1);

		object.off(type, handlerObject.handlerFunction);
		this._eventsForObjects[object._advSysID][type].splice(index, 1);
	},

	/**
	 * Removes all event listeners bounded to the map by this layer. This method is intended ONLY for internal use. Do NOT call it!
	 * @private
	 */
	_removeAllMapEventListeners: function () {
		for (let handlerObject of this._mapEvents)
			this.map.off(handlerObject.type, handlerObject.handlerFunction);
	},

	/**
	 * Being called when layer is being showed or and object is being added.
	 *
	 * This method is for internal use only. To add behavior upon showing, override onShow() public method.
	 * @private
	 */
	_onShow: function () {
		this.layers.addTo(this.map);
		this.isShown = true
	},

	/**
	 * Being called when layer is being hidden.
	 *
	 * This method is for internal use only. To add behavior upon hiding, override onHide() public method.
	 * @private
	 */
	_onHide: function () {
		this.layers.remove();
		this.isShown = false;
	},

	/**
	 * Being called when layer is being shown
	 */
	onShow() {},

	/**
	 * Being called when layer is being hidden
	 */
	onHide() {},

	/**
	 * Being called when user selects this layer.
	 *
	 * If you have additional controls to display, do it here.
	 */
	onSelect: function() {},

	/**
	 * Being called when user deselects this layer.
	 *
	 * If you've added additional controls, remove them here.
	 */
	onDeselect: function() {},

	/**
	 * Being called when user changes this layer's name
	 */
	onNameChange: function() {},

	/**
	 * Adds Leaflet layers to this SynthFlight layer.
	 *
	 * Do NOT override!
	 *
	 * @param layers Layers to add
	 */
	addLayers: function(...layers) {
		for (let layer of layers)
			this.layers.addLayer(layer);

		if (this.isShown)
			this._onShow();

		this._layerSystem._reorderLayers(); // We gotta reorder layers because Leaflet will bring lastly added layer on top.
	},

	/**
	 * Removes given layers with it's event handlers.
	 * @param layers - Layers to be removed. If layer extends LayerGroup, will also remove layers contained in it.
	 */
	removeLayers: function(...layers) {
		for (let layer of layers) {
			// Remove layers from the layer group
			if (layer.getLayers !== undefined) {
				let groupLayers = layer.getLayers();
				for (let l of groupLayers)
					this.removeLayers(l);
			}

			// Remove attached event listeners
			if (layer._advSysID !== undefined) {
				delete this._eventsForObjects[layer._advSysID];
				layer.clearAllEventListeners();
			}

			// Remove layer from both group and map
			this.layers.removeLayer(layer);
			layer.remove();
		}
	},

	/**
	 * Use it instead of constructor.
	 * @param wizardResults Results compiled from the wizard. It is an object who's keys are IDs of your controls and values are values of your controls.
	 */
	init: function(wizardResults) {
		let widgetLayer = new L.ALS.WidgetLayer();
		this.addLayers(widgetLayer.getLayer());
		widgetLayer.addWidget(new L.ALS.Widgets.Number("idk", "Test", this, "testCallback"));
		widgetLayer.addWidget(new L.ALS.Widgets.Color("idk2", "Test2", this, "testCallback"));
		widgetLayer.addWidget(new L.ALS.Widgets.SimpleLabel("label", "Label haha"));
	},

	testCallback: function (input) {
		console.log("New value is: " + input.getValue());
	},

	statics: {
		wizard: new L.ALS.Wizard()
	},

	// Wrappers

	/**
	 * @see FeatureGroup.setStyle
	 * @return {L.ALS.Layer} this
	 */
	setStyle: function (style) {
		this.layers.setStyle(style);
		return this;
	},

	/**
	 * @see FeatureGroup.getBounds
	 */
	getBounds: function () {
		return this.layers.getBounds();
	},

	/**
	 * @see FeatureGroup.eachLayer
	 * @return {L.ALS.Layer} this
	 */
	eachLayer: function (fn, context) {
		this.layers.eachLayer(fn, context);
		return this;
	},

	/**
	 * Called when layer is being exported. If you want to export more than only geometry, override this method.
	 *
	 * Default implementation is:
	 * ```JS
	 * return this.layers.toGeoJSON(precision);
	 * ```
	 *
	 * @see FeatureGroup.toGeoJSON
	 */
	toGeoJSON: function () {
		return this.layers.toGeoJSON();
	}

});