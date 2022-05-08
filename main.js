// Just want to mention here. Electron messes paths in scripts that has been imported from HTML.
// So, if we'll put this file into "js" directory and import GridManager like:
//      require("./LeafletAdvancedLayerSystem/System.js");
// We'll get an error. But following will work:
//      require("./js/LeafletAdvancedLayerSystem/System.js");
// This problem doesn't present in scripts that has been imported into other scripts.
// So the easiest solution is to move main.js into project's root directory.
// I've spend hours struggling with this issue, so don't try to reorganise the code, you'll fail and, as it seems, break compatibility with the older Electron versions.

//require("fastestsmallesttextencoderdecoder");
window.L = require("leaflet");

/**
 * Segments number to use when displaying L.Geodesic
 * @type {number}
 */
L.GEODESIC_SEGMENTS = 1000;

L.Geodesic = require("leaflet.geodesic").GeodesicLine;
require("leaflet-draw");
require("./DrawGeodesic.js");
require("leaflet-advanced-layer-system");
L.ALS.Locales.AdditionalLocales.Russian();
require("./node_modules/leaflet.coordinates/dist/Leaflet.Coordinates-0.1.5.min.js");
require("./locales/English.js");
require("./locales/Russian.js");
require("./SynthGeometryLayer/SynthGeometryLayer.js");
require("./SynthBaseLayer/SynthBaseLayer.js");
require("./SynthPolygonBaseLayer/SynthPolygonBaseLayer.js");
require("./SynthRectangleBaseLayer/SynthRectangleBaseLayer.js");
require("./SynthGridLayer/SynthGridLayer.js");
require("./SynthRectangleLayer/SynthRectangleLayer.js");
require("./SynthLineLayer/SynthLineLayer.js");
require("./SynthPolygonLayer/SynthPolygonLayer.js");
require("./SearchControl.js");
const drawLocales = require("leaflet-draw-locales").default;

// Update L.Draw locale on ALS locale change
let oldChangeLocale = L.ALS.Locales.changeLocale;

L.ALS.Locales.changeLocale = function (locale) {
	oldChangeLocale.call(this, locale);
	L.drawLocal = drawLocales(L.ALS.locale.language);
	L.ALS.Helpers.dispatchEvent(document.body, "synthflight-locale-changed");
}

L.ALS.System.initializeSystem();

// Create map
let map = L.map("map", {
	attributionControl: false, // Attribution will be present in About window
	zoomControl: false,
	minZoom: 1,
	maxBounds: L.latLngBounds(
		L.latLng(90, -Infinity),
		L.latLng(-90, Infinity)
	),
	maxBoundsViscosity: 1,
	preferCanvas: true, // Canvas is faster than SVG renderer
	keyboard: false,
	worldCopyJump: true,
}).setView([51.505, -0.09], 13);
map.doubleClickZoom.disable();


// Display a notification that users can move the map farther to jump to the other side of the world
let labelLayer = new L.ALS.LeafletLayers.LabelLayer(false), maxLabelWidth = 3,
	labelOpts = {
		maxWidth: 10,
		breakWords: false,
	},
	westOpts = {origin: "rightCenter", ...labelOpts},
	eastOpts = {origin: "leftCenter", ...labelOpts};
labelLayer.addTo(map);

map.on("moveend zoomend resize", () => {
	labelLayer.deleteAllLabels();

	let bounds = map.getBounds(), container = map.getContainer(),
		// Calculate label position by converting map's center from pixels to LatLng
		middleLat = map.containerPointToLatLng(L.point(container.clientWidth / 2, container.clientHeight / 2)).lat;

	if (bounds.getWest() <= -180) {
		labelLayer.addLabel("west", [middleLat, -180], L.ALS.locale.moveLabelWest, westOpts);
	}

	if (bounds.getEast() >= +180) {
		labelLayer.addLabel("east", [middleLat, 180], L.ALS.locale.moveLabelEast, eastOpts);
	}

	labelLayer.redraw();
});

// Initialize layer system. Create and add base layers.
let layerSystem = new L.ALS.System(map, {
	aboutHTML: require("./about.js"),
	filePrefix: "SynthFlight",
	enableHistory: true,
	enableToolbar: true,
	makeMapFullscreen: true,
	historySize: L.ALS.Helpers.supportsFlexbox ? 40 : 20, // Old browsers might have lower RAM limits
	toolbarZoomControl: new L.ALS.ControlZoom({vertical: true}),
});

// CartoDB
layerSystem.addBaseLayer(L.tileLayer("http://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png", {
	maxZoom: 19,
	noWrap: true,
}), "CartoDB");

// OSM
layerSystem.addBaseLayer(L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
	maxZoom: 19,
	noWrap: true,
}), "Open Street Maps");

// Google maps
let letters = [["m", "Streets"], ["s", "Satellite"], ["p", "Terrain"], ["s,h", "Hybrid"]];
for (let letter of letters) {
	layerSystem.addBaseLayer(L.tileLayer("http://{s}.google.com/vt/lyrs=" + letter[0] + "&x={x}&y={y}&z={z}", {
		maxZoom: 20,
		noWrap: true,
		subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
	}), "Google " + letter[1]);
}

// Yandex maps
let countries = ["ru_RU", "en_US", "uk_UA", "tr_TR"];
for (let country of countries) {
	layerSystem.addBaseLayer(L.tileLayer(`https://core-renderer-tiles.maps.yandex.net/tiles?l=map&v=21.07.25-1-b210701140430&x={x}&y={y}&z={z}&scale=1&lang=${country}&experimental_data_poi=no_extra_orgs`, {
		subdomains: ['01', '02', '03', '04'],
		reuseTiles: true,
		updateWhenIdle: false,
		noWrap: true,
	}), "Yandex " + country[3] + country[4]);
}

// Empty layer
layerSystem.addBaseLayer(L.tileLayer(""), "Empty");

// Add layer types
layerSystem.addLayerType(L.ALS.SynthPolygonLayer);
layerSystem.addLayerType(L.ALS.SynthGridLayer);
layerSystem.addLayerType(L.ALS.SynthRectangleLayer);
layerSystem.addLayerType(L.ALS.SynthLineLayer);
layerSystem.addLayerType(L.ALS.SynthGeometryLayer);

// Show coordinates via Leaflet.Control plugin. It doesn't look good on phones, so we won't add it in this case.
if (!L.ALS.Helpers.isMobile) {
	layerSystem.addControl(L.control.coordinates({
		position: "bottomleft",
		decimals: 5,
		labelTemplateLat: "Lat (y): {y}",
		labelTemplateLng: "Lng (x): {x}",
		enableUserInput: false,
		useLatLngOrder: true,
	}), "bottom");
}

// Add search. Symbol is not polyfilled in Chrome 7, 8 and, probably, some other versions.

if (window.Symbol) {
	require("./SearchWindow.js");
	let searchButton;
	if (L.ALS.Helpers.isMobile) {
		let control = new L.SearchControl();
		layerSystem.addControl(control, "top", "follow-menu");
		searchButton = control.getContainer();
	} else {
		searchButton = L.ALS._createSearchButton();
		let panel = document.getElementsByClassName("als-top-panel")[0];
		panel.insertBefore(searchButton, panel.getElementsByClassName("als-menu-add")[0]);
	}

	/**
	 * Search window. Will not be present in really old Chrome versions where Symbol can't be polyfilled
	 */
	L.ALS.searchWindow = new L.ALS.SearchWindow(map, searchButton);
}