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
	 * Name to be assigned to this layer by default. You can use locale property to localize it.
	 * @type {string}
	 * @public
	 */
	defaultName: "layerDefaultName",

	/**
	 * Indicates whether this layer is shown or not. Do NOT modify!
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
	 * @param layerSystem Layer system that creates this layer
	 * @param args {*[]} Arguments to pass to `init()`
	 * @param settings {Object} Settings to pass to `init()`
	 */
	initialize: function(layerSystem, args, settings) {
		L.ALS.Widgetable.prototype.initialize.call(this, "als-layer-menu");
		this.setConstructorArguments([args]);
		this.serializationIgnoreList.push("_layerSystem", "map", "_nameLabel", "layers", "_mapEvents", "getBounds", "isSelected");

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
		this._layerSystem = layerSystem;
		this.map = this._layerSystem.map;
		this.id = "SynthLayer" + L.ALS.Helpers.generateID();
		this.layers = L.featureGroup();
		this.name = this.defaultName;

		// Build menu
		// Handle
		let handle = document.createElement("i");
		handle.className = "als-layer-handle ri ri-drag-move-2-line";

		// Editable label containing layer's name
		let label = document.createElement("p");
		label.className = "als-layer-label";
		label.innerHTML = this.defaultName;

		// Make it editable on double click
		label.addEventListener("dblclick", function () {
			this.contentEditable = "true";
			this.focus();
		});

		// Make it not editable when user leaves
		label.addEventListener("blur", (event) => {
			let target = event.target;
			target.contentEditable = "false";
			this.setName(target.innerHTML);
		});

		// Make it end editing when user presses Enter
		label.addEventListener("keydown", function (event) {
			if (event.key === "Enter") {
				event.preventDefault();
				this.blur();
			}
		})

		// Drop-down menu button
		let menuButton = document.createElement("i");
		menuButton.className = "ri ri-settings-3-line";

		// Menu itself


		let hideFn, showFn;
		// Old chrome can't deal with animations below, so in this case we'll just change display property.
		if (!L.ALS.Helpers.supportsFlexbox && L.ALS.Helpers.isChrome) {
			hideFn = () => { this.container.style.display = "none"; };
			showFn = () => { this.container.style.display = ""; };
		} else {
			hideFn = () => {
				this.container.style.height = this.container.scrollHeight + "px";
				setTimeout(() => {
				if (this.container.getAttribute("data-hidden") === "1") // Seems like it prevents bugs when user clicks button continuously
						this.container.style.height = "0";
				}, 10); // Wait for height to apply
			};
			showFn = () => {
				this.container.style.height = this.container.scrollHeight + "px";
				setTimeout(() => {
					if (this.container.getAttribute("data-hidden") === "0") // Same as above
						this.container.style.height = "auto";
				}, 300); // Await animation end
			}
		}
		L.ALS.Helpers.makeHideable(menuButton, this.container, hideFn, showFn);

		// Hide/show button
		this._hideButton = document.createElement("i");
		this._hideButton.className = "ri ri-eye-line";
		L.ALS.Helpers.makeHideable(this._hideButton, undefined, () => {
			this._hideButton.className = "ri ri-eye-off-line";
			this._onHide();
			this.onHide();
		}, () => {
			this._hideButton.className = "ri ri-eye-line";
			this._onShow();
			this.onShow();
		}, false);

		let layerWidget = document.createElement("div");
		layerWidget.className = "als-layer-container";
		layerWidget.id = this.id;

		let controlsContainer = document.createElement("div");
		controlsContainer.className = "als-items-row";
		let elements = [handle, label, menuButton, this._hideButton];
		for (let e of elements)
			controlsContainer.appendChild(e);
		layerWidget.appendChild(controlsContainer);
		layerWidget.appendChild(this.container);
		layerWidget.addEventListener("click", () => { this._layerSystem._selectLayer(this.id); });

		this._layerSystem._layerContainer.appendChild(layerWidget);
		this._layerSystem._layers[this.id] = this;
		this._layerSystem._selectLayer(this.id); // Select new layer
		this._nameLabel = label;
		this.init(args, settings); // Initialize layer and pass all the properties
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
			object._advSysID = "advLayerSys" + L.ALS.Helpers.generateID();
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
	 * @see Layer.addEventListenerTo For more information
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
	init: function(wizardResults, settings) {},

	/**
	 * Deletes this layer
	 * @param shouldAskUser {boolean} If set to true, the message asking if user wants to delete selected layer will be displayed. Otherwise, layer will be silently deleted.
	 */
	deleteLayer: function (shouldAskUser = false) {
		this._layerSystem._selectLayer(this.id);
		this._layerSystem._deleteLayer(shouldAskUser);
	},

	/**
	 * Being called upon deletion. There you can clean up everything you've done which can't be undone by the system (i.e., added layers directly to the map or created elements on the page)
	 */
	onDelete: function () {},

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
	 * Sets name of this layer
	 * @param name {string} Name to set
	 */
	setName: function (name) {
		this.name = name;
		this._nameLabel.innerHTML = this.name;
		this.onNameChange();
	},

	/**
	 * @return {string} Name of this layer
	 */
	getName: function () {
		return this.name;
	},

	/**
	 * Called when layer is being exported. If you want to export more than only geometry, override this method.
	 *
	 * Default implementation is:
	 * ```JS
	 * return this.layers.toGeoJSON();
	 * ```
	 *
	 * @see L.FeatureGroup.toGeoJSON
	 */
	toGeoJSON: function () {
		return this.layers.toGeoJSON();
	},

	/**
	 * Copies settings to this layer as properties
	 * @param settings {Object} `settings` argument passed to `init()`
	 */
	copySettingsToThis: function (settings) {
		for (let s in settings) {
			if (s !== "skipSerialization" && s !== "skipDeserialization")
				this[s] = settings[s];
		}
	},


	/**
	 * Being called when user updates the settings. Use it to update your layer depending on changed settings.
	 * @param settings {Object} Same as settings passed to `init()`
	 */
	applyNewSettings: function (settings) {},

	/**
	 * Serializes some important properties. Must be called at `serialize()` in any layer!
	 * @param serialized {Object} Your serialized object
	 */
	serializeImportantProperties: function (serialized) {
		let props = ["name", "isShown", "isSelected"]
		for (let prop of props)
			serialized[prop] = this[prop];
	},

	serialize: function (seenObjects) {
		let serialized = L.ALS.Widgetable.prototype.serialize.call(this, seenObjects);
		this.serializeImportantProperties(serialized);
		return serialized;
	},

	statics: {

		/**
		 * Wizard instance which gives a layer it's initial properties
		 * @type {L.ALS.Wizard}
		 */
		wizard: new L.ALS.Wizard(),

		/**
		 * Settings instance
		 * @type {L.ALS.Settings}
		 */
		settings: new L.ALS.Settings(),

		/**
		 * Deserializes some important properties. Must be called at `deserialize` in any layer!
		 * @param serialized {Object} Serialized object
		 * @param instance {L.ALS.Layer|Object} New instance of your layer
		 */
		deserializeImportantProperties: function (serialized, instance) {
			instance.setName(serialized.name);
			let props = ["isShown", "isSelected"];
			for (let prop of props)
				instance[prop] = serialized[prop];
		},

		deserialize: function (serialized, layerSystem, settings, seenObjects) {
			serialized.constructorArguments = [layerSystem, serialized.constructorArguments[0], settings];
			let instance = L.ALS.Widgetable.deserialize(serialized, seenObjects);
			L.ALS.Layer.deserializeImportantProperties(serialized, instance);
			return instance;
		}
	},

});