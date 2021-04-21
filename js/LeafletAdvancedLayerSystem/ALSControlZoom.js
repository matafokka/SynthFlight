/**
 * Custom zoom control which matches ALS aesthetics.
 * @class
 * @extends L.Control
 */
L.ALS.ControlZoom = L.Control.extend( /** @lends L.ALS.ControlZoom.prototype */{

	onAdd: function (map) {
		let minusButton = document.createElement("i");
		minusButton.className = "als-button-base icon-button ri ri-subtract-line";
		minusButton.addEventListener("click", () => {
			map.zoomOut();
		});

		let plusButton = document.createElement("i");
		plusButton.className = "als-button-base icon-button ri ri-add-line";
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