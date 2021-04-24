/**
 * Customizable widgetable window. Creation of the window is a very slow process, so please, reuse existing windows as much as possible.
 *
 * Some important properties:
 *
 * 1. {@link L.ALS.WidgetableWindow#windowContainer} -- container for the window which should be added to the page
 * 1. {@link L.ALS.WidgetableWindow#window} -- actual window. It contains only one child: {@link L.ALS.Widgetable}'s container ({@link L.ALS.Widgetable#container} property). You can add custom elements to the window at {@link L.ALS.WidgetableWindow#initialize}.
 * 1. {@link L.ALS.WidgetableWindow#container} -- Widgetable's container.
 *
 * @param button {Element} Button which will activate this window
 *
 * @class
 * @extends L.ALS.Widgetable
 */
L.ALS.WidgetableWindow = L.ALS.Widgetable.extend( /** @lends L.ALS.WidgetableWindow.prototype */ {

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