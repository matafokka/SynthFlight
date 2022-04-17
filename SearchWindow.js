const MiniSearch = require("minisearch");
const debounce = require("debounce");

/**
 * A window that searches Geometry Layers and OSM
 *
 * @class
 * @extends L.ALS.WidgetableWindow
 */
L.ALS.SearchWindow = L.ALS.WidgetableWindow.extend(/** @lends L.ALS.SearchWindow.prototype */{
	initialize: function (map, button = undefined) {
		L.ALS.WidgetableWindow.prototype.initialize.call(this, button);

		/**
		 * {@link L.ALS.SynthGeometryLayer}s to search in
		 * @private
		 */
		this._docs = {}
		this.updateIndex();

		// Add window to the document
		document.body.appendChild(this.windowContainer);
		this.container.classList.add("search-window-container");

		// Create search input and insert it before the content
		let searchInput = document.createElement("input");
		searchInput.className = "search-input";
		searchInput.type = "text";
		L.ALS.Locales.localizeElement(searchInput, "searchPlaceholder", "placeholder");
		this.window.insertBefore(searchInput, this.container);

		let layersContainer = document.createElement("div"),
			osmContainer = document.createElement("div");
		this.container.appendChild(layersContainer);
		this.container.appendChild(osmContainer);

		this.window.classList.add("search-window");

		let closeButton = this.addCloseButton("close", "searchCloseButton"),

			// When search result is clicked, fly to the target's bbox
			onClick = (e) => {
				L.ALS.Helpers.dispatchEvent(closeButton.input, "click");
				let bbox = e.target.bbox;
				map.flyToBounds(
					L.latLngBounds(L.latLng(bbox[1], bbox[0]), L.latLng(bbox[3], bbox[2])), {
						animate: true,
						duration: 1
					});
			},

			// When results are found, adds them to the window
			addResults = (results, isOSM = true) => {
				let title = document.createElement("div"), noResults = results.length === 0, container;
				title.className = "als-window-sidebar-title";

				if (isOSM) {
					container = osmContainer;
					L.ALS.Locales.localizeElement(title, noResults ? "searchNoOSMResults" : "searchOSMResults");
				}
				else {
					container = layersContainer;
					L.ALS.Locales.localizeElement(title, noResults ? "searchNoLayersResults" : "searchLayersResults");
				}

				container.appendChild(title);

				for (let result of results) {
					let elem = document.createElement("div");
					elem.className = "als-button-base search-result";

					if (isOSM)
						elem.textContent = result.properties.display_name; // Use name returned by the API for OSM results
					else {
						// Build name from matching terms for layers
						let name = "";
						for (let term in result.match) {
							if (!result.match.hasOwnProperty(term))
								continue;
							let key = result.match[term],
								newName = name + `<b>${key}</b>: ${result.properties[key]}; `;

							// Name should contain at least one key and not be too long. The used way of cropping is the
							// best compromise for long keys and long values, I think.
							if (name !== "" && newName > 500)
								break;

							name += `<b>${key}</b>: ${result.properties[key]}; `;
						}

						name = name.substring(0, name.length - 2); // Remove last divider
						L.ALS.Helpers.HTMLToElement(name, elem);
					}

					elem.bbox = result.bbox;
					elem.addEventListener("click", onClick);
					container.appendChild(elem);
				}
			},

			// If got an error when fetching data from the Nominatim, adds an error message
			displayError = (errorText, parseAsHTML = false) => {
				let label = new L.ALS.Widgets.SimpleLabel("id", parseAsHTML ? " " : errorText, "justify", "error");

				if (parseAsHTML)
					L.ALS.Helpers.HTMLToElement(errorText, label.input);

				osmContainer.appendChild(label.container);
			},

			// Clears all children from the given container
			clearContainer = (container) => {
				while (container.firstChild)
					container.removeChild(container.firstChild);
			},

			// Search function, called on input
			search = () => {
				// Search layers
				clearContainer(layersContainer);
				addResults(this._search.search(searchInput.value, {fuzzy: true}), false);

				// Search OSM through Nominatim API
				// Nominatim redirects all requests to the HTTPS with TLS 1.2. Legacy browsers doesn't support it,
				// but we'll still do requests through XHR/XDR in case there will be an API that supports
				// non-secure HTTP. If this'll ever happen, we'll be able to quickly replace Nominatim with it.

				let request = L.ALS.Helpers.isIElte9 ? new XDomainRequest() : new XMLHttpRequest();

				// "progress" event should always be handled in IE9
				if (L.ALS.Helpers.isIElte9)
					request.onprogress = (e) => console.log(e);

				// Handle connection loss
				request.onerror  = () => {
					clearContainer(osmContainer);
					displayError("searchCantConnect");
				};

				request.onload = (e) => {
					if (request.readyState !== 4)
						return;

					clearContainer(osmContainer);

					// If server responded, try to parse GeoJSON
					if (request.status === 200) {
						try {
							let json = JSON.parse(request.responseText);
							addResults(json.features);
						} catch (e) {
							// Handle invalid GeoJSON
							console.log(e);
							displayError("searchInvalidJson");
						}
						return;
					}

					// Handle bad responses

					let responseText = request.responseText.trim(),
						errText = request.responseText.startsWith(request.status) ? responseText : `${request.status}: ${responseText}`;

					displayError(
						// Error, OSM server responded with the following message: "message_text". Please, try opening
						`${L.ALS.locale.searchBadResponse1}: "${errText}". ${L.ALS.locale.searchBadResponse2} ` +
						// OSM search in browser
						`<a href="https://nominatim.openstreetmap.org" target="_blank">${L.ALS.locale.searchBadResponse3}</a>. ` +
						// If it doesn't work, OSM search is temporarily unavailable. Otherwise, please, create an issue at
						L.ALS.locale.searchBadResponse4 +
						// SynthFlight repository
						` <a href="https://github.com/matafokka/SynthFlight/issues" target="_blank">${L.ALS.locale.searchBadResponse5}</a>.`
					, true);
				}

				// Get query and sanitize it. replace() removes the UTF surrogates.
				let query = encodeURIComponent(searchInput.value.replace(/[\ud800-\udfff]/g, ""));
				request.open("GET", `https://nominatim.openstreetmap.org/search?q=${query}&format=geojson`, true);

				try {
					request.send();
				} catch (e) {
					console.log(e);
				}
			}

		searchInput.addEventListener("input", debounce(search, 200));
	},

	/**
	 * Adds MiniSearch document to search in
	 * @param layerId {string} Layer ID
	 * @param docs {Object[]} Documents to add
	 * @param fields {string[]} Fields to search on
	 */
	addToSearch: function (layerId, docs, fields) {
		this._docs[layerId] = {docs, fields};
		this.updateIndex();
	},

	/**
	 * Removes doc added by layerId from the search
	 * @param layerId {string} Layer ID
	 */
	removeFromSearch: function (layerId) {
		delete this._docs[layerId];
		this.updateIndex();
	},

	/**
	 * Updates search index
	 */
	updateIndex: function () {
		let docs = [], fields = [];

		for (let id in this._docs) {
			if (!this._docs.hasOwnProperty(id))
				continue;

			let layerData = this._docs[id];
			docs.push(...layerData.docs);
			fields.push(...layerData.fields);
		}

		this._search = new MiniSearch({
			fields,
			storeFields: ["id", "bbox", "properties"],
			idField: "_miniSearchId"
		});

		this._search.addAll(docs);
	}
})