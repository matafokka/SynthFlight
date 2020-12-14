L.ALS = {

	/**
	 * Dispatches event of given type to given object.
	 * @param object Object to dispatch event to
	 * @param type Type of event
	 * @public
	 */
	dispatchEvent: function (object, type) {
		let event;
		if (typeof (Event) === "function") {
			event = new Event(type);
		} else {
			event = document.createEvent('Event');
			event.initEvent(type, true, true);
		}
		object.dispatchEvent(event);
	},

	/**
	 * Formats number to more readable format by inserting spaces
	 * @param number {number | string} Number to format
	 * @return {string} Formatted number
	 */
	formatNumber: function (number) {
		let numberString = number.toString();
		let finalString = "", fraction = "", repeats = 0;
		for (let i = numberString.length - 1; i >= 0; i--) {
			let symbol = numberString[i];

			if (symbol === ".") {
				finalString = "." + fraction;
				repeats = 0;
				continue;
			}

			if (repeats === 3) {
				finalString = " " + finalString;
				repeats = 0;
			}

			finalString = symbol + finalString;
			fraction = symbol + fraction;
			repeats++;
		}
		return finalString;
	}
};

const Sortable = require("sortablejs");
const JSZip = require("jszip");
require("./Widgetable.js");
require("./WidgetLayer.js");
require("./Wizard.js");
require("./Layer.js");

/**
 * Advanced extensible layer system for Leaflet. Manages things like layer creation, ordering, deletion and much more for you.
 *
 * Just add it, implement your layers, register them, and you're good to go.
 *
 * Usage:
 * <pre>
 * require("AdvancedLayerSystem"); // Require this plugin or add it to your .html page via "script" tag
 * require("./MyLayerType.js"); // Require your custom layer types
 * let layerSystem = new L.Control.LeafletAdvancedLayerSystem(map); // Create an instance of this class
 * let baseLayer = ...; // Create some base layers
 * layerSystem.addBaseLayer(baseLayer, "My Base Layer"); // Add your base layers to the system
 * layerSystem.addLayerType(L.MyLayerType); // Add your layer types
 * </pre>
 *
 * So all you have to do is to implement your layer types. They should do whatever you do with Leaflet. The layer system will do the rest.
 *
 * Start by extending L.AdvancedLayer (if you imported this, you have that already) and reading docs on it.
 */
L.ALS.System = L.Control.extend({

	/**
	 * Constructor for the layer system.
	 *
	 * @param map - Leaflet map object to manage
	 * @param enableProjectSystem {boolean} - If set to true, will enable project system. User will be able to save and restore projects, but you have to do extra work. You might want to implement your own system yourself.
	 */
	initialize: function (map, enableProjectSystem = true) {

		/**
		 * Contains base layers. Layers will be added in format: "Name": layer object. addBaseLayer() will update this object.
		 */
		this._baseLayers = {};

		/**
		 * Contains layers' types.
		 */
		this._layerTypes = {};

		/**
		 * Contains all added layers. Needed to track z-Index changes.
		 */
		this._layers = {};

		/**
		 * Currently selected layer
		 */
		this._selectedLayer = undefined;

		this.map = map;
		const markup = require("./markup.js");
		markup();

		// Wizard-related stuff

		this._wizardContainer = document.getElementById("wizard-container");
		this._wizardContent = document.getElementById("wizard-content");
		this._wizardMenu = document.getElementById("wizard-menu");
		this._layerContainer = document.getElementById("menu-items");
		this._wizardMenu.addEventListener("change", (event) => {
			this._displayWizardControls(event);
		});

		// Add event listeners to "Cancel" and "Add" buttons
		document.getElementById("wizard-cancel-button").addEventListener("click", () => {
			this._closeWizard();
		});
		document.getElementById("wizard-add-button").addEventListener("click", () => {
			this._createLayer();
		});

		// Menu-related stuff

		this._baseLayerMenu = document.getElementById("menu-maps-select");
		this._baseLayerMenu.addEventListener("change", (event) => {
			this._onBaseLayerChange(event);
		});

		this._saveButton = document.getElementById("adv-lyr-sys-save-button");
		this._saveButton.addEventListener("click", () => {
			this._saveProject();
		});

		this._loadButton = document.getElementById("adv-lyr-sys-load-button");
		this._loadButton.addEventListener("click", () => {
			this._loadProject();
		});

		this._exportButton = document.getElementById("adv-lyr-sys-export-button");
		this._exportButton.addEventListener("click", () => {
			this._exportProject();
		});

		this._settingsButton = document.getElementById("adv-lyr-sys-settings-button");
		this._settingsButton.addEventListener("click", () => {
			this._openSettings();
		});

		// Add event listeners to "Add" and "Delete" buttons
		document.getElementById("menu-add").addEventListener("click", () => {
			this._showWizard();
		});
		document.getElementById("menu-delete").addEventListener("click", () => {
			this._deleteLayer();
		});

		// Layer-related stuff

		// Make layers sortable. We have to reorder layers when their widgets has been reordered and when map state changes. See _reorderLayers() implementation.
		let sortableOptions = {
			handle: ".layer-handle",
			animation: 250,
			onEnd: () => {
				this._reorderLayers();
			}
		};

		// Parcel and NodeJS resolves require of ES 6 module (or just SortableJS) differently. Here we detect it.
		if (Sortable.Sortable !== undefined)
			Sortable.Sortable.create(this._layerContainer, sortableOptions);
		else
			new Sortable(this._layerContainer, sortableOptions);
	},

	// Base layers

	/**
	 * Changes base layer
	 * @param event - onchange event
	 * @private
	 */
	_onBaseLayerChange: function (event) {
		this.map.removeLayer(this._previousBaseLayer); // Remove previously set layer
		this._previousBaseLayer = this._baseLayers[event.target.value]; // Get currently selected layer and mark it as previously added
		this._previousBaseLayer.addTo(this.map); // Add it to the map
	},

	/**
	 * Adds base layer
	 * @param layer - Layer to add
	 * @param name {string} - Name of the layer to be displayed in the drop-down menu
	 */
	addBaseLayer: function (layer, name) {
		let item = document.createElement("option"); // Create an option element
		item.text = name; // Set it's text to the passed layer's name
		this._baseLayers[name] = layer; // Add layer to the base layers' object
		this._baseLayerMenu.appendChild(item); // Add option to the "select" element

		if (this._previousBaseLayer === undefined) {
			this._previousBaseLayer = layer;
			this._previousBaseLayer.addTo(this.map);
		}
	},

	// Layer system

	/**
	 * Adds given layer type to the layer system
	 * @param layerType - Class of the layer to add
	 * @public
	 */
	addLayerType: function (layerType) {
		let name = layerType.wizard.displayName;
		let option = document.createElement("option");
		option.text = name;
		this._wizardMenu.appendChild(option);

		let container = layerType.wizard.container;
		this._wizardContent.appendChild(container);

		this._layerTypes[name] = {
			layerType: layerType,
			container: container
		};

		// Menu will display all added controls, so we gotta fire change event and by doing that calling displayWizardControls()
		L.ALS.dispatchEvent(this._wizardMenu, "change");
	},

	// Wizard-related stuff

	_showWizard: function () {
		this._wizardContainer.setAttribute("data-hidden", "0");
	},

	_closeWizard: function () {
		this._wizardContainer.setAttribute("data-hidden", "1");
	},

	_displayWizardControls: function (event) {
		for (let child of this._wizardContent.children)
			child.setAttribute("data-hidden", "1");
		this._layerTypes[event.target.value].container.setAttribute("data-hidden", "0");
	},

	// Layers-related stuff

	/**
	 * Creates new layer, acts as factory. Will be called when user adds layer through the wizard.
	 * @private
	 */
	_createLayer: function () {
		let type = this._layerTypes[this._wizardMenu.value].layerType;

		// Gather all properties
		let properties = {};
		for (let property in type.wizard._widgets) {
			if (!type.wizard._widgets.hasOwnProperty(property))
				continue;
			let widget = type.wizard._widgets[property];
			properties[widget.id] = widget.getValue();
		}

		// Create layer
		let layer = new type(this.map, this);
		this._layers[layer.id] = layer;

		// Build layer's widget

		// Handle
		let handle = document.createElement("i");
		handle.className = "layer-handle fas fa-arrows-alt";
		//handle.innerText = "☰";

		// Editable label containing layer's name
		let label = document.createElement("p");
		label.className = "layer-label";
		label.innerText = layer.defaultName;

		// Make it editable on double click
		label.addEventListener("dblclick", function () {
			this.contentEditable = "true";
			this.focus();
		});

		// Make it not editable when user leaves
		label.addEventListener("blur", (event) => {
			let target = event.target;
			target.contentEditable = "false";
			layer.name = target.innerText;
			layer.onNameChange();
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
		menuButton.className = "fas fa-cog";

		// Menu itself
		let menu = layer.container;
		this._makeHideable(menuButton, menu);
		menu.setAttribute("data-hidden", "1");

		// Hide/show button
		let hideButton = document.createElement("i");
		hideButton.className = "fas fa-eye";
		this._makeHideable(hideButton, undefined, () => {
			hideButton.className = "fas fa-eye-slash";
			layer.onHide();
		}, () => {
			hideButton.className = "fas fa-eye";
			layer.onShow();
		});

		let layerWidget = document.createElement("div");
		layerWidget.className = "layer-container";
		layerWidget.id = layer.id;

		let elements = [handle, label, menuButton, hideButton, menu];
		for (let e of elements)
			layerWidget.appendChild(e);

		layerWidget.addEventListener("click", () => {
			this._selectLayer(layer.id); // Defined in main.js
		});

		this._layerContainer.appendChild(layerWidget);
		this._selectLayer(layer.id); // Select new layer
		this._closeWizard();
		layer.init(properties); // Initialize layer and pass all the properties
	},

	/**
	 * Selects layer with given ID. This has been bound in SynthLayer.
	 * @param layerId ID of a layer to select.
	 */
	_selectLayer: function (layerId) {
		if (this._selectedLayer !== undefined) {
			if (this._selectedLayer.id === layerId)
				return;
			this._selectedLayer.onDeselect();
		}

		// Deselect other layers and select given layer
		for (let layer in this._layers) {
			this._layers[layer].isSelected = false;
		}

		this._layers[layerId].isSelected = true;
		this._selectedLayer = this._layers[layerId];
		this._selectedLayer.onSelect();

		// Do the same for HTML elements
		let children = this._layerContainer.childNodes;
		for (let child of children)
			child.setAttribute("data-is-selected", "0");
		document.getElementById(layerId).setAttribute("data-is-selected", "1");
	},

	/**
	 * Deletes selected layer and LITERALLY everything related to it
	 */
	_deleteLayer: function () {
		if (this._selectedLayer === undefined || !window.confirm("Are you sure you want to delete this layer?"))
			return;

		// Remove layer's widget
		let widget = document.getElementById(this._selectedLayer.id);
		widget.parentElement.removeChild(widget);

		// Remove layer from the map
		this._selectedLayer.layers.remove();
		this._selectedLayer._removeAllMapEventListeners();

		// Remove every property, so there will be no references and event handlers
		for (let property in this._selectedLayer)
			// noinspection JSUnfilteredForInLoop
			delete this._selectedLayer[property]; // It doesn't miss hasOwnProperty() check. We're destroying the whole object.

		// Delete reference from layers object
		delete this._layers[this._selectedLayer.id];

		// Select first added layers or make selected layer undefined. That will remove the last reference to it.
		let firstChild = this._layerContainer.firstElementChild;
		if (firstChild !== null)
			this._selectLayer(firstChild.id);
		else
			this._selectedLayer = undefined;
	},

	/**
	 * Reorders layers. Will be called upon actual reordering and when it's needed to change Z-indices and bring everything back to normal;
	 * @private
	 */
	_reorderLayers: function () {
		let children = this._layerContainer.childNodes;
		for (let i = 0; i <= children.length; i++) {
			let child = children[i];
			if (child === undefined)
				continue;
			this._layers[child.id].layers.bringToBack();
		}
	},

	/**
	 *
	 * Implements event forwarding. When event is being fired, the topmost will receive it even if it's hidden or something.
	 *
	 * So we need to bring the layer to the front, pass event to it and put it back.
	 *
	 * This method does exactly that.
	 *
	 * @param event Event to be passed
	 */
	_passEvent: function (event) {

		this._selectedLayer.layers.bringToFront(); // Bring selected layer to the front

		// Refire DOM event.
		// Recursively passing an event to the group's children is costly and hard.
		let oldEvent = event.originalEvent;
		let newEvent = new oldEvent.constructor(oldEvent.type, oldEvent); // Clone old event
		oldEvent.target.dispatchEvent(newEvent); // The target will be a canvas, not a Leaflet object. So let's dispatch cloned event to it
		this._reorderLayers(); // Bring selected layer back to it's place simply by reloading layers
	},

	// Project-related stuff

	/**
	 * Exports each layer to GeoJSON file, generates zip archive with them and saves it
	 * @private
	 */
	_exportProject: function () {
		let filenames = {};
		let zip = new JSZip();
		for (let name in this._layers) {
			if (!this._layers.hasOwnProperty(name))
				continue;
			let layer = this._layers[name];

			let postfix = "";
			if (filenames.hasOwnProperty(layer.name)) {
				postfix = " (" + filenames[layer.name] + ")";
				filenames[layer.name]++;
			}
			else
				filenames[layer.name] = 1;

			zip.file(layer.name + postfix + ".geojson", JSON.stringify(layer.toGeoJSON()));
		}

		zip.generateAsync({type:"blob"}).then(function (blob) {
			let filename = "SynthFlightProject.zip";
			if (window.navigator.msSaveOrOpenBlob) { // IE workaround
				window.navigator.msSaveBlob(blob, filename);
				return;
			}

			let link = document.createElement("a");
			link.download = filename;
			link.href = window.URL.createObjectURL(blob);
			//link.dataset.downloadurl = ['text/plain', link.download, link.href].join(':'); // Seems like this line is useless. TODO: Possibly remove it
			link.click();
		}).catch();
	},

	_loadProject: function () {
		window.alert("Sorry, projects loading is not implemented yet");
	},
	_openSettings: function () {
		window.alert("Sorry, settings are not implemented yet");
	},

	_saveProject: function () {
		window.alert("Sorry, projects saving is not implemented yet");
		//this._selectedLayer.layers.eachLayer((l) => {console.log(l);})
		let json = {};
		let layers = this._selectedLayer.layers.getLayers();
		for (let layer of layers) {

		}
	},

	/*_fillJson: function (json, layer) {
		if (layer.getLayers !== undefined) {
			let layers = layer.getLayers();
			for (let l of layers) {

			}
		}
	}*/

	// Helpers

	/**
	 * Makes button hide or show element on click. Both button and element will have attribute "data-hidden" equal to 0 or 1.
	 * @param button {HTMLElement} Button that will control visibility of the element.
	 * @param element {HTMLElement} Element that will be controlled
	 * @param onHideCallback {function} Function to call on hiding
	 * @param onShowCallback {function} Function to call on showing
	 * @private
	 */
	_makeHideable: function (button, element = undefined, onHideCallback = undefined, onShowCallback = undefined) {
		let dataHidden = "data-hidden", haveElement = element !== undefined;
		button.setAttribute(dataHidden, "0");
		if (haveElement)
			element.setAttribute(dataHidden, "1");
		button.setAttribute(dataHidden, "1");

		button.addEventListener("click", function () {
			let newValue, callback;
			if (button.getAttribute(dataHidden) === "1") {
				newValue = "0";
				callback = onHideCallback;
			} else {
				newValue = "1";
				callback = onShowCallback;
			}

			button.setAttribute(dataHidden, newValue);
			if (haveElement)
				element.setAttribute(dataHidden, newValue);

			if (callback !== undefined)
				callback();
		});
	},

});