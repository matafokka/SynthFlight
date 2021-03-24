/**
 * Sets this layer to be interactive or not.
 * @param interactive {boolean} If true, this layer will be interactive. Otherwise layer will be static.
 * @author Piero "Jadaw1n" Steinger. Home page: https://github.com/Jadaw1n
 */
L.Layer.prototype.setInteractive = function (interactive) {
	if (this.getLayers) {
		this.getLayers().forEach(layer => {
			layer.setInteractive(interactive);
		});
		return;
	}
	if (!this._path) {
		return;
	}

	this.options.interactive = interactive;

	if (interactive) {
		L.DomUtil.addClass(this._path, 'leaflet-interactive');
	} else {
		L.DomUtil.removeClass(this._path, 'leaflet-interactive');
	}
};

/**
 * @return {boolean} True, if this layer is interactive. False otherwise.
 */
L.Layer.prototype.getInteractive = function () {
	return this.options.interactive;
}

/**
 * Alias for Layer.getInteractive()
 * @return {boolean} True, if this layer is interactive. False otherwise.
 */
L.Layer.prototype.isInteractive = function () {
	return this.getInteractive();
}