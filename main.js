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
require("./SynthBase/SynthBaseLayer.js");
require("./SynthPolygonLayer/SynthPolygonLayer.js");
require("./SynthGridLayer/SynthGridLayer.js");
require("./SynthRectangleLayer/SynthRectangleLayer.js");
require("./SynthLineLayer/SynthLineLayer.js");
require("./SearchControl.js");
require("./SearchWindow.js");

L.ALS.System.initializeSystem();

// Create map
let map = L.map("map", {
	attributionControl: false, // Attribution will be present in About window
	zoomControl: false,
	minZoom: 1,
	maxBounds: L.latLngBounds(
		L.latLng(90, -180),
		L.latLng(-90, 180)
	),
	maxBoundsViscosity: 1,
	preferCanvas: true, // Canvas is faster than SVG renderer
	keyboard: false,
}).setView([51.505, -0.09], 13);
map.doubleClickZoom.disable();

// Show coordinates via Leaflet.Control plugin. It doesn't look good on phones, so we won't add it in this case.
if (!L.ALS.Helpers.isMobile) {
	L.control.coordinates({
		position: "bottomleft",
		decimals: 5,
		labelTemplateLat: "Lat (y): {y}",
		labelTemplateLng: "Lng (x): {x}",
		enableUserInput: false,
		useLatLngOrder: true,
	}).addTo(map);
}

// Initialize layer system. Create and add base layers.
let layerSystem = new L.ALS.System(map, {
	aboutHTML: require("./about.js"),
	filePrefix: "SynthFlight",
	enableHistory: true,
	enableToolbar: true,
	makeMapFullscreen: true,
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

// On menu position change
/*document.addEventListener("als-set-menu-to-left", () => setSearchPos("topright"));
document.addEventListener("als-set-menu-to-right", () => setSearchPos("topleft"));
document.addEventListener("click", e => {
	if (!searchControl.getContainer().contains(e.target))
		searchControl.hide();
})*/

// Empty layer
layerSystem.addBaseLayer(L.tileLayer(""), "Empty");

// Add layer types
layerSystem.addLayerType(L.ALS.SynthGridLayer);
layerSystem.addLayerType(L.ALS.SynthRectangleLayer);
layerSystem.addLayerType(L.ALS.SynthLineLayer);
layerSystem.addLayerType(L.ALS.SynthGeometryLayer);

// Add search

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

L.ALS.searchWindow = new L.ALS.SearchWindow(map, searchButton);