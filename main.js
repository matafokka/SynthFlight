// Just want to mention here. Electron messes paths in scripts that has been imported from HTML.
// So, if we'll put this file into "js" directory and import GridManager like:
//      require("./LeafletAdvancedLayerSystem/System.js");
// We'll get an error. But following will work:
//      require("./js/LeafletAdvancedLayerSystem/System.js");
// This problem doesn't present in scripts that has been imported into other scripts.
// So the easiest solution is to move main.js into project's root directory.
// I've spent hours struggling with this issue, so don't try to reorganise the code, you'll fail and, as it seems, break compatibility with the older Electron versions.

//require("fastestsmallesttextencoderdecoder");
window.L = require("leaflet");

/**
 * Segments number to use when displaying L.Geodesic
 * @type {number}
 */
L.GEODESIC_SEGMENTS = 500;

L.Geodesic = require("leaflet.geodesic").GeodesicLine;
require("./WrappedPolyline.js");
require("leaflet-draw");
require("./DrawGeodesic.js");
require("leaflet-advanced-layer-system");
L.ALS.Locales.AdditionalLocales.Russian();
require("./node_modules/leaflet.coordinates/dist/Leaflet.Coordinates-0.1.5.min.js");
require("./locales/English.js");
require("./locales/Russian.js");
require("./SynthGeneralSettings.js");
require("./SynthGeometryBaseWizard.js");
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

// Fix spacing between tiles. See this comment for details: https://github.com/Leaflet/Leaflet/issues/3575#issuecomment-1262578435

let gridLayerOriginalInitTile = L.GridLayer.prototype._initTile
L.GridLayer.include({
	_initTile: function (tile) {
		gridLayerOriginalInitTile.call(this, tile);

		let tileSize = this.getTileSize();

		tile.style.width = tileSize.x + 0.5 + "px";
		tile.style.height = tileSize.y + 0.5 + "px";
	}
});

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
	fadeAnimation: false
}).setView([51.505, -0.09], 13);
map.doubleClickZoom.disable();


// Display a notification that users can move the map farther to jump to the other side of the world

let labelLayer = new L.ALS.LeafletLayers.LabelLayer(false),
	labelOpts = {
		maxWidth: 10,
		breakWords: false,
	},
	westOpts = {origin: "rightCenter", ...labelOpts},
	eastOpts = {origin: "leftCenter", ...labelOpts};

let labelsPaneElement = map.createPane("mapLabelsPane");

labelLayer.options.pane = "mapLabelsPane";
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

// Add black overlay to hide polygons when editing is not active

L.BlackOverlayLayer = L.GridLayer.extend({
	createTile: function(coords) {
		let tile = L.DomUtil.create("canvas", "leaflet-tile"),
			{_northEast, _southWest} = this._tileCoordsToBounds(coords);

		if (_southWest.lng >= -180 && _northEast.lng <= 180)
			return tile;

		let ctx = tile.getContext("2d"),
			{x, y} = this.getTileSize();
		tile.width = x;
		tile.height = y;

		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, x, y);

		return tile;
	}
});

map.createPane("blackOverlayPane");

let overlayLayer = new L.BlackOverlayLayer({
	noWrap: true,
	pane: "blackOverlayPane",
	updateWhenIdle: false,
	updateWhenZooming: false,
}).addTo(map);

// When drawing starts, hide notifications and black overlay, but add red datelines

let datelines = new L.FeatureGroup();
for (let lng of [180, -180]) {
	datelines.addLayer(new L.Polyline([[90, lng], [-90, lng]], {
		color: "red",
		weight: 1,
	}));
}

map.on("draw:drawstart draw:editstart draw:deletestart", () => {
	overlayLayer.setOpacity(0);
	labelsPaneElement.style.opacity = "0";
	datelines.addTo(map);
});

map.on("draw:drawstop draw:editstop draw:deletestop", () => {
	overlayLayer.setOpacity(1);
	labelsPaneElement.style.opacity = "1";
	datelines.remove();
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
	generalSettings: L.ALS.SynthGeneralSettings
});

// CartoDB
layerSystem.addBaseLayer(L.tileLayer("http://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png", {
	maxZoom: 19,
}), "CartoDB");

// OSM
layerSystem.addBaseLayer(L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
	maxZoom: 19,
}), "Open Street Maps");

// Google maps
let letters = [["m", "Streets"], ["s", "Satellite"], ["p", "Terrain"], ["s,h", "Hybrid"]];
for (let letter of letters) {
	layerSystem.addBaseLayer(L.tileLayer("http://{s}.google.com/vt/lyrs=" + letter[0] + "&x={x}&y={y}&z={z}", {
		maxZoom: 20,
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
	}), "Yandex " + country[3] + country[4]);
}

// Empty layer
layerSystem.addBaseLayer(L.tileLayer(""), "Empty");

// Add layer types
layerSystem.addLayerType(L.ALS.SynthGridLayer);
layerSystem.addLayerType(L.ALS.SynthRectangleLayer);
layerSystem.addLayerType(L.ALS.SynthPolygonLayer);
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