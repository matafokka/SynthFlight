const cacheName = "SynthFlight", matchOptions = {ignoreSearch: true};

// Cache project files. More files are added in build.js. Preserve the comment inside of array!
// The whole thing works like auto update.
caches.open(cacheName).then(cache => cache.addAll([
	"./", "./PWAServiceWorker.js", "./css/styles.css", "./main.js", /** to_cache_list */
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