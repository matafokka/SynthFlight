/**
 * Creates a button that should open search window, i.e. should be passed to the {@link L.ALS.SearchWindow} constructor.
 * @returns {HTMLElement}
 */
L.ALS._createSearchButton = function () {
	let button = document.createElement("i");
	button.className = "ri ri-search-line";
	L.ALS.Locales.localizeElement(button, "searchButtonTitle", "title");
	return button;
}

/**
 * A control that opens search window. To get HTMLElement, use {@link L.SearchControl#getContainer}.
 * @class
 * @extends L.Control
 */
L.SearchControl = L.Control.extend(/** @lends L.SearchControl.prototype */{
	initialize: function (options) {
		L.Control.prototype.initialize.call(this, options);
		this._button = L.ALS._createSearchButton();
	},

	onAdd: function (map) {
		return this._button;
	}
});