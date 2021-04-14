/**
 * Custom zoom control which looks and works better than Leaflet's. Also matches ALS aesthetics.
 */
L.ALS.ControlZoom = L.Control.extend({

	onAdd: function (map) {
		let minusButton = document.createElement("i");
		minusButton.className = "button-base icon-button ri ri-subtract-line";
		minusButton.addEventListener("click", () => {
			map.zoomOut();
		});

		let plusButton = document.createElement("i");
		plusButton.className = "button-base icon-button ri ri-add-line";
		plusButton.addEventListener("click", () => {
			map.zoomIn();
		});

		let container = document.createElement("div");
		container.className = "leaflet-bar leaflet-control als-zoom";
		container.appendChild(minusButton);
		container.appendChild(plusButton);
		return container;
	}

});