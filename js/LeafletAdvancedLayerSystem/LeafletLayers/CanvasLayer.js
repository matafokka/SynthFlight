/*
Generic  Canvas Layer for leaflet 0.7 and 1.0-rc, 1.2, 1.3
copyright Stanislav Sumbera,  2016-2018, sumbera.com , license MIT
originally created and motivated by L.CanvasOverlay  available here: https://gist.github.com/Sumbera/11114288

also thanks to contributors: heyyeyheman,andern,nikiv3, anyoneelse ?
enjoy !
__________________

Modified by matafokka (c) 2021.
I have no idea how it works, I just removed useless functionality and made API look nice since I just copied the code 'cuz I don't want to install Bower just to get this library.
*/

// L.DomUtil.setTransform from leaflet 1.0.0 to work on 0.0.7
L.DomUtil.setTransform = L.DomUtil.setTransform || function (el, offset, scale) {
	let pos = offset || new L.Point(0, 0);

	el.style[L.DomUtil.TRANSFORM] =
		(L.Browser.ie3d ?
			'translate(' + pos.x + 'px,' + pos.y + 'px)' :
			'translate3d(' + pos.x + 'px,' + pos.y + 'px,0)') +
		(scale ? ' scale(' + scale + ')' : '');
};

/**
 * A canvas layer for Leaflet. This class is based on L.CanvasLayer (https://github.com/Sumbera/gLayers.Leaflet), but heavily modified, so stick to this class' docs.
 *
 * Canvas is always the size of the screen, it's size, position and everything is being recalculated when map is being moved or resized. When it happens, `draw()` method is being called.
 *
 * Override {@link L.ALS.LeafletLayers.CanvasLayer#draw} method and implement your stuff here.
 *
 * @example Typical usage:
 * let points = [] // Imagine that there're some points
 * // Extend this class
 * let MyCanvas = L.ALS.LeafletLayers.CanvasLayer.extend({
 *     // Override `draw()` method
 *     draw: function (data) {
 *         let ctx = data.canvas.getContext('2d'); // Get canvas context
 *         ctx.clearRect(0, 0, data.canvas.width, data.canvas.height); // Clear previously drawn stuff
 *         // Add points on canvas
 *         for (let point of points) {
 *             // If point is not in the view, don't draw it to save time.
 *             // Though, if part of your image still must be shown, consider extending those bounds. You have to do it yourself.
 *             if (!data.bounds.contains(point))
 *                 continue;
 *             // Draw the point
 *             coords = this.latLngToCanvasCoords(point); // Convert coordinates from LatLng to canvas coordinate system.
 *             // Draw circle representing the point
 *             ctx.beginPath();
 *             ctx.arc(coords.x, coords.y, 3, 0, Math.PI * 2);
 *             ctx.fill();
 *             ctx.closePath();
 *         }
 *     }
 * });
 * let canvas = new MyCanvas().addTo(map); // Add canvas to the map
 *
 * @param alwaysOnBottom {boolean} If browser doesn't support "pointer-events" CSS property on HTML elements, canvas will be at very bottom. Otherwise canvas will always stay at the top. To make canvas stay always on bottom and unify experience, set this property to `true`
 *
 * @class
 * @extends L.Layer
 */
L.ALS.LeafletLayers.CanvasLayer = (L.Layer ? L.Layer : L.Class).extend( /** @lends L.ALS.LeafletLayers.CanvasLayer.prototype */ {

	initialize: function (alwaysOnBottom = false) {
		this._map = null;
		this._canvas = null;
		this._frame = null;
		this._alwaysOnBottom = alwaysOnBottom;
		this._events = {
			resize: this._onLayerResize,
			moveend: this._onLayerMove,
			zoom: this._onLayerMove,
		};
	},

	/**
	 * Redraws content of this layer.
	 * @return {L.ALS.LeafletLayers.CanvasLayer} this
	 */
	redraw: function () {
		if (!this._frame)
			this._frame = L.Util.requestAnimFrame(this._drawLayer, this);
		return this;
	},

	_onLayerResize: function (resizeEvent) {
		this._canvas.width = resizeEvent.newSize.x;
		this._canvas.height = resizeEvent.newSize.y;
	},

	_onLayerMove: function () {
		let topLeft = this._map.containerPointToLayerPoint([0, 0]);
		L.DomUtil.setPosition(this._canvas, topLeft);
		this._drawLayer();
	},

	/**
	 * Called when layer is being added to the map. If overridden, parent method must be called!
	 * @param map Map to add this layer to.
	 */
	onAdd: function (map) {
		this._map = map;
		this._canvas = document.createElement("canvas");
		this._canvas.className = "leaflet-layer leaflet-zoom-" +
			(this._map.options.zoomAnimation && L.Browser.any3d) ? "animated" : "hide";

		// Disable event handling on canvas.
		// Older browsers (and IE <= 10) doesn't support pointerEvents property. So let's just move the canvas down.
		// In other cases, bring canvas to the top, so it won't be covered by other layers
		this._canvas.style.cssText = "pointer-events: auto"; // Feature detection technique taken from https://github.com/ausi/Feature-detection-technique-for-pointer-events
		this._canvas.style.zIndex = (this._canvas.style.pointerEvents === "auto" && !this._alwaysOnBottom) ? "9999" : "0";
		this._canvas.style.pointerEvents = "none";

		let size = this._map.getSize();
		this._canvas.width = size.x;
		this._canvas.height = size.y;

		map._panes.overlayPane.appendChild(this._canvas);

		map.on(this._events, this);
		this._onLayerMove(); // Fixes incorrect canvas size
	},

	/**
	 * Called upon layer removal. If overridden, parent method must be called!
	 * @param map Map to remove this layer from
	 */
	onRemove: function (map) {
		if (this._frame)
			L.Util.cancelAnimFrame(this._frame);
		map.getPanes().overlayPane.removeChild(this._canvas);
		map.off(this._events, this);
		this._canvas = null;
	},

	/**
	 * Adds this layer to a given map
	 * @param map Map to add this layer to.
	 * @return {L.ALS.LeafletLayers.CanvasLayer} this
	 */
	addTo: function (map) {
		map.addLayer(this);
		if (this._map.options.zoomAnimation && L.Browser.any3d)
			this._events.zoomanim = this._animateZoom;
		return this;
	},

	_drawLayer: function () {
		this.draw({
			layer: this,
			canvas: this._canvas,
			bounds: this._map.getBounds(),
			size: this._map.getSize(),
			zoom: this._map.getZoom(),
		});
		this._frame = null;
	},

	_animateZoom: function (e) {
		let scale = this._map.getZoomScale(e.zoom);
		// Different calc of animation zoom in leaflet 1.0.3 thanks @peterkarabinovic, @jduggan1
		let offset = L.Layer ? this._map._latLngBoundsToNewLayerBounds(this._map.getBounds(), e.zoom, e.center).min :
			this._map._getCenterOffset(e.center)._multiplyBy(-scale).subtract(this._map._getMapPanePos());

		L.DomUtil.setTransform(this._canvas, offset, scale);
	},

	/**
	 * Being called upon layer redrawing. Override this method and implement your stuff here.
	 * @param data Contains information about the canvas
	 * @param data.layer this
	 * @param data.canvas {HTMLCanvasElement} Canvas
	 * @param data.bounds Current map bounds, see `L.Map.getBounds()`
	 * @param data.size Current map size, see `L.Map.getSize()`
	 * @param data.zoom {number} Current map zoom, see `L.Map.getZoom()`
	 */
	draw: function (data) {},

	/**
	 * Converts latLng coordinates to canvas coordinates.
	 * Basically, returns map.latLngToContainerPoint(latLng).
	 * @param latLng Coordinate to convert
	 * @return {{x:number, y:number}} Converted coordinates.
	 */
	latLngToCanvasCoords: function (latLng) {
		return this._map.latLngToContainerPoint(latLng);
	},

	/**
	 * Converts canvas coordinates to latLng.
	 * @param coords {number[]} Coordinates to convert, array in format [x, y]
	 * @return {{lat:number, lng:number}} Converted coordinates.
	 */
	canvasCoordsToLatLng: function (coords) {
		return this._map.containerPointToLatLng(coords);
	}

});

/**
 * Alias for {@link L.ALS.LeafletLayers.CanvasLayer}
 * @lends L.ALS.LeafletLayers.CanvasLayer
 */
L.CanvasLayer = L.ALS.LeafletLayers.CanvasLayer;