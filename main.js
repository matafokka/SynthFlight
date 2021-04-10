// Just want to mention here. Electron messes paths in scripts that has been imported from HTML.
// So, if we'll put this file into "js" directory and import GridManager like:
//      require("./LeafletAdvancedLayerSystem/System.js");
// We'll get an error. But following will work:
//      require("./js/LeafletAdvancedLayerSystem/System.js");
// This problem doesn't present in scripts that has been imported into other scripts.
// So the easiest solution is to move main.js into project's root directory.
// I've spend hours struggling with this issue, so don't try to reorganise the code, you'll fail and, as it seems, break compatibility with the older Electron versions.

require("./js/LeafletAdvancedLayerSystem/System.js");
require("./js/LeafletAdvancedLayerSystem/locales/Russian.js");
require("./js/SynthFlightModules/locales/English.js");
require("./js/SynthFlightModules/locales/Russian.js");
require("./js/SynthFlightModules/SynthShapefileLayer.js");
require("./js/SynthFlightModules/SynthGridLayer.js");
require("./node_modules/leaflet.coordinates/dist/Leaflet.Coordinates-0.1.5.min.js")

L.ALS.System.initializeSystem();

// Create map
let map = L.map("map", {
	attributionControl: false, // Attribution will be present in About window
	zoomControl: false,
	minZoom: 2, // Leaflet will hide everything below this zoom
	maxBounds: L.latLngBounds( // This will disable infinite panning
		L.latLng(90, -180),
		L.latLng(-90, 180)
	),
	maxBoundsViscosity: 1,
	preferCanvas: true, // Canvas is faster than SVG renderer
	keyboard: false,
}).setView([51.505, -0.09], 13);
map.doubleClickZoom.disable();

map.addControl(new L.ALS.ControlZoom({ position: "topleft" }));

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

let layerSystem = new L.ALS.System(map, true, require("./js/SynthFlightModules/about.js")).addTo(map);

let osmLayer = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	noWrap: true,
	attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
});
layerSystem.addBaseLayer(osmLayer, "Open Street Maps");

// Google maps
let letters = [["m", "Streets"], ["s", "Satellite"], ["p", "Terrain"], ["s,h", "Hybrid"]];
for (let letter of letters) {
	let layer = L.tileLayer("http://{s}.google.com/vt/lyrs=" + letter[0] + "&x={x}&y={y}&z={z}", {
		maxZoom: 20,
		noWrap: true,
		subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
	});
	layerSystem.addBaseLayer(layer, "Google " + letter[1]);
}

// Yandex maps
let countries = ["ru_RU", "en_US", "uk_UA", "tr_TR"];
for (let country of countries) {
	let layer = L.tileLayer("http://vec{s}.maps.yandex.net/tiles?l=map&v=4.55.2&z={z}&x={x}&y={y}&scale=2&lang=" + country, {
		subdomains: ['01', '02', '03', '04'],
		attribution: '<a href="yandex.ru" target="_blank">Yandex</a>',
		reuseTiles: true,
		updateWhenIdle: false,
		noWrap: true,
	});
	layerSystem.addBaseLayer(layer, "Yandex " + country[3] + country[4]);
}

// Empty layer
layerSystem.addBaseLayer(L.tileLayer(""), "Empty");

// Add layer types
layerSystem.addLayerType(L.ALS.SynthGridLayer);
layerSystem.addLayerType(L.ALS.SynthShapefileLayer);