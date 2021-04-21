/**
 * Customizable widgetable window. Creation of the window is a very slow process, so please, reuse existing windows as much as possible.
 *
 * Some important properties:
 *
 * 1. `windowContainer` -- container for the window which should be added to the page
 * 1. `window` -- actual window. It contains only one child: widgetable's container (`container` property). You can add custom elements to the window using it's methods.
 * 1. `container` -- Widgetable's container.
 *
 * @param button {Element} Button which will activate this window
 *
 * @class
 * @extends L.ALS.Widgetable
 */
L.ALS.WidgetableWindow = L.ALS.Widgetable.extend( /** @lends L.ALS.WidgetableWindow.prototype */ {

	/** @constructs */
	initialize: function (button) {
		L.ALS.Widgetable.prototype.initialize.call(this, "als-window-content");
		this.setConstructorArguments(arguments);

		/**
		 * Container for the window which should be added to the page
		 * @type {HTMLDivElement}
		 */
		this.windowContainer = document.createElement("div");
		this.windowContainer.className = "als-window-background";

		/**
		 * Window which contains Widgetable's container
		 * @type {HTMLDivElement}
		 */
		this.window = document.createElement("div");
		this.window.className = "als-window-window";

		this.window.appendChild(this.container);
		this.windowContainer.appendChild(this.window);

		L.ALS.Helpers.makeHideable(button, this.windowContainer, undefined, undefined, false);
	}
});