const cacheName = "SynthFlight", matchOptions = {ignoreSearch: true};

// Cache project files. More files are added in build.js. Preserve the comment inside of array!
// The whole thing works like auto update.
caches.open(cacheName).then(cache => cache.addAll([
	"/", "/PWAServiceWorker.js", "/css/styles.css", "/main.js", "/electronApp.js","/package.json","/node_modules/leaflet-draw/dist/images/spritesheet.svg","/node_modules/leaflet-draw/dist/images/spritesheet.png","/node_modules/leaflet-draw/dist/images/spritesheet-2x.png","/node_modules/leaflet-draw/dist/images/marker-shadow.png","/node_modules/leaflet-draw/dist/images/marker-icon.png","/node_modules/leaflet-draw/dist/images/marker-icon-2x.png","/node_modules/leaflet-draw/dist/images/layers.png","/node_modules/leaflet-draw/dist/images/layers-2x.png","/node_modules/leaflet-draw/dist/leaflet.draw.css","/node_modules/leaflet.coordinates/dist/Leaflet.Coordinates-0.1.5.css","/node_modules/leaflet/dist/images/marker-shadow.png","/node_modules/leaflet/dist/images/marker-icon.png","/node_modules/leaflet/dist/images/marker-icon-2x.png","/node_modules/leaflet/dist/images/layers.png","/node_modules/leaflet/dist/images/layers-2x.png","/node_modules/leaflet/dist/leaflet.css","/node_modules/leaflet-advanced-layer-system/dist/polyfills.js","/node_modules/leaflet-advanced-layer-system/dist/css/remixicon.woff2","/node_modules/leaflet-advanced-layer-system/dist/css/remixicon.woff","/node_modules/leaflet-advanced-layer-system/dist/css/remixicon.ttf","/node_modules/leaflet-advanced-layer-system/dist/css/remixicon.symbol.svg","/node_modules/leaflet-advanced-layer-system/dist/css/remixicon.svg","/node_modules/leaflet-advanced-layer-system/dist/css/remixicon.less","/node_modules/leaflet-advanced-layer-system/dist/css/remixicon.eot","/node_modules/leaflet-advanced-layer-system/dist/css/base.css","/manifest.json","/img/logo-apple.png","/img/logo.png","/img/logo.svg","/img/logo.ico","/index.html",/** to_cache_list */
]));

// On resource fetch, try to load it from cache or pass request to fetch()
self.addEventListener("fetch", event => {
	event.respondWith(
		caches.open(cacheName)
			.then(cache => cache.match(event.request, matchOptions))
			.then(response => {
				return response || fetch(event.request)
					.catch(() => console.log(`Failed to fetch: "${event.request.url}"`));
			})
	);
});