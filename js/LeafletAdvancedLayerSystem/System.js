/**
 * Root object containing all AdvancedLayerSystem stuff
 */
L.ALS = {

	/**
	 * Contains classes for internal use. Should not be used outside of the system.
	 */
	_service: {}
};

const Sortable = require("sortablejs");
const JSZip = require("jszip");
const saveAs = require("file-saver");
require("./InteractiveLayerPatch.js");
require("./Helpers.js");
require("./Serializable.js");
require("./Widgetable.js");
require("./widgets/Widgets.js");
require("./WidgetableWindow.js");
require("./_service/SidebarWindow.js");
require("./_service/WizardWindow.js");
require("./Wizard.js");
require("./Layer.js");
require("./LeafletLayers/LeafletLayers.js");

/**
 * Advanced extensible layer system for Leaflet. Manages things like layer creation, ordering, deletion and much more for you.
 *
 * Just add it, implement your layers, register them, and you're good to go.
 *
 * Usage:
 * ```JS
 * require("AdvancedLayerSystem.js"); // Require this plugin or add it to your .html page via "script" tag
 * require("./MyALSModule.js"); // Require your custom ALS modules such as layers, widgets, etc.
 *
 * L.ALS.System.initializeSystem(); // Initialize system. This method MUST be called after all Leaflet and ALS imports.
 *
 * let map = L.map("map", { // Create a map
 *     preferCanvas: true, // Use it to improve performance
 *     keyboard: false // Setting this option to false is a MANDATORY! If you don't do that, you'll encounter problems when using L.ALS.LeafletLayers.WidgetLayer!
 * })
 *
 * let layerSystem = new L.Control.LeafletAdvancedLayerSystem(map); // Create an instance of this class
 * let baseLayer = ...; // Create some base layers
 * layerSystem.addBaseLayer(baseLayer, "My Base Layer"); // Add your base layers to the system
 * layerSystem.addLayerType(L.MyLayerType); // Add your layer types
 * ```
 *
 * So all you have to do is to implement your layer types. They should do whatever you do with Leaflet. The layer system will do the rest.
 *
 * Start by extending L.AdvancedLayer (if you imported this, you have that already) and reading docs on it.
 */
L.ALS.System = L.Control.extend({

	skipSerialization: true,
	skipDeserialization: true,

	/**
	 * Constructor for the layer system.
	 *
	 * @param map - Leaflet map object to manage
	 * @param enableProjectSystem {boolean} - If set to true, will enable project system. User will be able to save and restore projects, but you have to do extra work. You might want to implement your own system yourself.
	 */
	initialize: function (map, enableProjectSystem = true) {
		L.Control.prototype.initialize.call(this);

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

		require("./_service/markup.js");

		// Wizard-related stuff
		this.wizardWindow = new L.ALS._service.WizardWindow(document.getElementById("menu-add"));
		document.body.appendChild(this.wizardWindow.windowContainer);

		this._wizardMenu = document.getElementById("wizard-menu");
		this._layerContainer = document.getElementById("menu-items");

		// Add event listeners to "Add" button
		document.getElementById("wizard-add-button").addEventListener("click", () => {
			this._createLayer();
		});

		// Menu-related stuff
		this.menu = document.getElementById("menu");
		if (L.ALS.Helpers.isMobile)
			this.menu.classList.add("menu-mobile");
		L.ALS.Helpers.makeHideable(document.getElementById("menu-close"), this.menu);

		this._baseLayerMenu = document.getElementById("menu-maps-select");
		this._baseLayerMenu.addEventListener("change", (event) => {
			this._onBaseLayerChange(event);
		});

		this._saveButton = document.getElementById("adv-lyr-sys-save-button");
		this._saveButton.addEventListener("click", () => {
			this._saveProject();
		});

		// Points to input, not to a button in the menu
		this._loadButton = document.getElementById("adv-lyr-sys-load-input");
		this._loadButton.addEventListener("change", () => {

			if (!window.FileReader && !L.ALS.Helpers.isIElte9) { // "!FileReader" throws exception in IE9
				window.alert("Sorry, your browser doesn't support project loading. However, you still can create a new project, save it and open it later in a newer browser.");
				this._loadButton.value = "";
				return;
			}

			if (!L.ALS.Helpers.isObjectEmpty(this._layers) && !window.confirm("You already have an opened project. Are you sure you wan't to load another one?")) {
				this._loadButton.value = "";
				return;
			}

			if (L.ALS.Helpers.isIElte9) {
				let fso = new ActiveXObject("Scripting.FileSystemObject");
				let file = fso.openTextFile(this._loadButton.value);
				let content = file.readAll();
				file.close();
				this._loadProject(content);
				this._loadButton.value = "";
				return;
			}

			let fileReader = new FileReader();
			fileReader.onloadend = () => {
				this._loadProject(fileReader.result);
				this._loadButton.value = "";
			}
			fileReader.readAsText(this._loadButton.files[0]);

		});

		this._exportButton = document.getElementById("adv-lyr-sys-export-button");
		this._exportButton.addEventListener("click", () => {
			this._exportProject();
		});

		this._settingsButton = document.getElementById("adv-lyr-sys-settings-button");
		this._settingsButton.addEventListener("click", () => {
			this._openSettings();
		});

		document.getElementById("menu-delete").addEventListener("click", () => {
			this._deleteLayer();
		});

		// Make layers sortable. We have to reorder layers when their widgets has been reordered and when map state changes. See _reorderLayers() implementation.
		// noinspection JSUnusedGlobalSymbols
		new Sortable(this._layerContainer, {
			handle: ".layer-handle",
			animation: 250,
			onEnd: () => {
				this._reorderLayers();
			}
		});
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
		this.wizardWindow.addItem(name, layerType.wizard);
		this._layerTypes[name] = {
			layerType: layerType,
			container: layerType.wizard.container
		};
	},

	// Layers-related stuff

	/**
	 * Creates new layer from wizard, acts as factory. Will be called when user adds layer through the wizard.
	 * @private
	 */
	_createLayer: function () {
		let type = this._layerTypes[this._wizardMenu.value].layerType;
		// Gather arguments from wizard
		let args = {};
		for (let property in type.wizard._widgets) {
			if (!type.wizard._widgets.hasOwnProperty(property))
				continue;
			let widget = type.wizard._widgets[property];
			args[widget.id] = widget.getValue();
		}
		new type(this, args);
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

		// Deselect other layers, remove interactive and dragging abilities, and select given layer
		for (let prop in this._layers) {
			let layer = this._layers[prop];
			layer.isSelected = false;
			if (!layer.layers)
				continue;
			layer.layers.eachLayer((leafletLayer) => {
				if (leafletLayer.wasInteractive === undefined && leafletLayer.getInteractive)
					leafletLayer.wasInteractive = leafletLayer.getInteractive();

				if (leafletLayer.setInteractive)
					leafletLayer.setInteractive(false);

				if (leafletLayer.dragging) {
					if (leafletLayer.wasDraggable === undefined)
						leafletLayer.wasDraggable = leafletLayer.dragging.enabled();
					leafletLayer.dragging.disable();
				}
			});
		}

		this._layers[layerId].isSelected = true;
		this._selectedLayer = this._layers[layerId];

		if (this._selectedLayer.layers) {
			this._selectedLayer.layers.eachLayer((leafletLayer) => {
				if (leafletLayer.setInteractive && leafletLayer.wasInteractive)
					leafletLayer.setInteractive(true);

				if (leafletLayer.wasDraggable && leafletLayer.dragging)
					leafletLayer.dragging.enable();

				delete leafletLayer.wasInteractive;
				delete leafletLayer.wasDraggable;
			});
		}

		this._selectedLayer.onSelect();

		// Do the same for HTML elements
		let children = this._layerContainer.childNodes;
		for (let child of children)
			child.setAttribute("data-is-selected", "0");
		document.getElementById(layerId).setAttribute("data-is-selected", "1");
	},

	/**
	 * Deletes selected layer and LITERALLY everything related to it
	 * @param shouldAskUser {boolean} If set to true, the message asking if user wants to delete selected layer will be displayed. Otherwise, layer will be silently deleted.
	 */
	_deleteLayer: function (shouldAskUser = true) {
		if (this._selectedLayer === undefined || (shouldAskUser && !window.confirm("Are you sure you want to delete this layer?")))
			return;

		this._selectedLayer.onDelete();

		// Remove layer's widget
		let widget = document.getElementById(this._selectedLayer.id);
		widget.parentNode.removeChild(widget);

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
		this.forEachLayer(function (layer) {
			layer.layers.bringToBack();
		});
	},

	/**
	 * Loops through each layer in menu position order and calls callback.
	 * @param callback {function(L.ALS.Layer)} Function to call on each layer
	 */
	forEachLayer: function (callback) {
		let children = this._layerContainer.childNodes;
		for (let i = 0; i <= children.length; i++) {
			let child = children[i];
			if (child === undefined)
				continue;
			callback(this._layers[child.id]);
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
		L.ALS.System.notifyIfDataURLIsNotSupported();
		// Gather GeoJSON representation of all layers and either build zip or download as text
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
			} else
				filenames[layer.name] = 1;

			let json = JSON.stringify(layer.toGeoJSON());
			let filename = layer.name + postfix + ".geojson";

			if (L.ALS.Helpers.supportsDataURL) // Any normal browser
				zip.file(filename, json);
			else
				L.ALS.System.saveAsText(json, filename);
		}

		if (!L.ALS.Helpers.supportsDataURL)
			return;

		// FileSaver doesn't work correctly with older Chrome versions (around v14). So we have to perform following check:
		let type = L.ALS.System.supportsBlob ? "blob" : "base64";
		zip.generateAsync({type: type}).then((data) => {
			let filename = "SynthFlightProject.zip";
			if (L.ALS.System.supportsBlob)
				saveAs(data, filename)
			else
				L.ALS.System.createDataURL(filename, "application/zip", "base64", data);
		}).catch((reason) => {
			console.log(reason);
		});
	},

	_saveProject: function () {
		let json = { layerOrder: [] };

		this.forEachLayer((layer) => {
			json.layerOrder.push(layer.id);
		})

		let seenObjects = {};
		for (let id in this._layers) {
			let layer = this._layers[id];
			json[layer.id] = layer.serialize(seenObjects);
		}
		L.ALS.Serializable.cleanUp(seenObjects);
		L.ALS.System.saveAsText(JSON.stringify(json), "SynthFlightProject.json");
	},

	_loadProject: function (json) {
		try { this._loadProjectWorker(json); }
		catch (e) {
			// TODO: Add mechanism to change program name and link to the program's page
			// TODO: Remove "pre-alpha state" notice when project will come out of alpha state
			window.alert("File that you try to load is not SynthFlight project. If you're sure that everything's correct, please, open Developer Tools and create an issue with displayed error message at https://github.com/matafokka/SynthFlight.\n\nKeep in mind that SynthFlight is in pre-alpha state, so your old projects just might be not supported in a newer version.");
			console.log(e);
		}
	},

	_loadProjectWorker: function (json) {
		let serializedJson = JSON.parse(json); // Do it here so layers won't be removed if user have chosen wrong file

		// Remove all current layers
		for (let id in this._layers)
			this._layers[id].deleteLayer();
		this._layers = {};

		let selectedLayerID;
		let seenObjects = {};
		for (let id of serializedJson.layerOrder) {
			if (!serializedJson.hasOwnProperty(id))
				continue;

			let serialized = serializedJson[id];
			let constructor = L.ALS.Serializable.getSerializableConstructor(serialized.serializableClassName);
			let layer = constructor.deserialize(serialized, this, seenObjects);

			if (!layer.isShown)
				L.ALS.Helpers.dispatchEvent(layer._hideButton, "click");

			if (layer.isSelected)
				selectedLayerID = layer.id;
		}
		if (selectedLayerID !== undefined)
			this._selectLayer(selectedLayerID);

		L.ALS.Serializable.cleanUp(seenObjects);
	},

	_openSettings: function () {
		window.alert("Sorry, settings are not implemented yet");
	},

	onAdd: function () {
		let button = document.createElement("a");
		button.id = "menu-button";
		button.className = "button-base icon-button fas fa-bars";
		L.ALS.Helpers.makeHideable(button, this.menu);

		let container = document.createElement("div");
		container.className = "leaflet-bar leaflet-control";
		container.appendChild(button);
		return container;
	},

	/**
	 * Sets position of the menu button and menu itself, i.e. if position is "topleft" or "bottomleft", both button and menu will be on the left side of the map.
	 * @param position {"topleft"|"bottomleft"|"topright"|"bottomright"} Position to set
	 * @return {L.ALS.System} this
	 */
	setPosition: function (position) {
		L.Control.prototype.setPosition.call(this, position);
		let name = "menu-left";
		if (position === "topleft" || position === "bottomleft")
			this.menu.classList.add(name);
		else
			this.menu.classList.remove(name);
		return this;
	},

	statics: {

		inconvenienceText: "Sorry for the inconvenience. Please, update your browser, so this and many other things on the web won't happen.\n\nYour download will start after you'll close this window.",

		supportsBlob: !!(JSZip.support.blob && (!window.webkitURL || (window.URL && window.URL.createObjectURL))),

		notifyIfDataURLIsNotSupported: function (extension = "geojson") {
			if (L.ALS.Helpers.supportsDataURL)
				return;

			let firstLine;
			if (L.ALS.Helpers.isIElte9) {
				firstLine = "Please, download all the files"
				if (extension !== "")
					firstLine += " and manually set their extensions to \"" + extension + "\"";
			} else {
				firstLine = "Please, manually save text form all tabs that will open ";
				if (extension === "")
					firstLine += "after you'll close this window";
				else
					firstLine += "to \"" + extension + "\" files.";
			}
			window.alert(firstLine + "\n" + L.ALS.System.inconvenienceText);
		},

		createDataURL: function (filename, mediatype, encoding, data, notifyIfCantKeepExtension = true) {
			let link = document.createElement("a");
			if (!link.download && notifyIfCantKeepExtension) {
				let ext = L.ALS.Helpers.getFileExtension(filename);
				if (ext.length !== 0)
					window.alert("Please, manually change extension of the downloaded file to \"" + ext + "\".\n" + L.ALS.System.inconvenienceText);
			}
			link.download = filename;
			link.href = "data:" + mediatype + ";" + encoding + "," + data;
			if (link.click)
				link.click();
			else // link.click() is not implemented in some older browsers
				L.ALS.Helpers.dispatchEvent(link, "click");
		},

		saveAsText: function (string, filename) {
			if (L.ALS.System.supportsBlob) {
				saveAs(new Blob([string], {type: 'text/plain'}), filename);
				return;
			}
			if (L.ALS.Helpers.supportsDataURL) {
				this.createDataURL(filename, "text/plain", "base64",
					// Taken from https://attacomsian.com/blog/javascript-base64-encode-decode
					btoa(encodeURIComponent(string).replace(/%([0-9A-F]{2})/g,
						function (match, p1) {
							return String.fromCharCode('0x' + p1);
						})), false);
				return;
			}

			if (!L.ALS.Helpers.isIElte9)
				this.notifyIfDataURLIsNotSupported(L.ALS.Helpers.getFileExtension(filename));

			// Chrome 7 and IE9
			let fileWindow = window.open("", "_blank");
			fileWindow.document.open('text/plain');
			fileWindow.document.write(string);
			if (L.ALS.Helpers.isIElte9) {
				fileWindow.document.execCommand('SaveAs', true, filename + ".txt");
				fileWindow.close();
			}
		},

		/**
		 * Performs some important operations. Must be called after all Leaflet and ALS imports.
		 * @param scaleUIForPhoneUsers {boolean} If set to true, UI for phone users will be scaled automatically. Otherwise UI size will stay the same. Scaling is done by increasing root font size to 36pt.
		 */
		initializeSystem: function (scaleUIForPhoneUsers = true) {

			// If user's device is a phone, make UI a bit bigger
			if (scaleUIForPhoneUsers && L.ALS.Helpers.isMobile)
				document.querySelector(":root").style.fontSize = "36pt";

			// Add class names to all Leaflet and ALS classes for serialization
			let addClassName = function (object, scope) {
				for (let prop in object) {
					let newObject = object[prop];
					let brackets = (!(newObject instanceof Object) || newObject instanceof Array);
					if (!object.hasOwnProperty(prop) || newObject === null || newObject === undefined ||
						(newObject.serializableClassName !== undefined) ||
						brackets
					)
						continue;
					let newScope = scope + "." + prop;

					if (newObject.addInitHook !== undefined) {
						newObject.addInitHook(function () {
							this.serializableClassName = newScope;
						});
					}

					if (newObject.prototype !== undefined)
						newObject.prototype.serializableClassName = newScope;

					addClassName(newObject, newScope);
				}
			}
			addClassName(L, "L");
		}
	}

});
