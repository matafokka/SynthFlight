const debounce = require("debounce");

/**
 * A sidebar window with ability to add items to it
 *
 * @param button {Element} Button which will activate this window
 * @param sidebarTitle {string} Title of the sidebar. You can pass locale property to localize it.
 * @param contentTitle {string} Title of the content. You can pass locale property to localize it.
 * @param closeButtonTitle {string} Title of the close button. You can pass locale property to localize it.
 * @param onCloseCallback {Function} Function that will be called when user will close the window.
 *
 * @class
 * @extends L.ALS.WidgetableWindow
 * @ignore
 */
L.ALS._service.SidebarWindow = L.ALS.WidgetableWindow.extend( /** @lends L.ALS._service.SidebarWindow.prototype */ {

	maxHeight: 0,
	sidebarWidth: 0,
	isSidebarHidden: false,

	initialize: function (button, sidebarTitle, contentTitle, closeButtonTitle = "sidebarWindowCancelButton", onCloseCallback = undefined) {
		L.ALS.WidgetableWindow.prototype.initialize.call(this, button);
		this.items = {};
		this.window.classList.add("als-sidebar-window");

		L.ALS.Helpers.HTMLToElement(`
<div class="als-sidebar-window-wrapper" data-id="wrapper">
	<div class="hidden" data-id="select-container">
		<div class="als-window-sidebar-title" data-als-locale-property="${sidebarTitle}"></div>
		<select class="als-window-select" data-id="select"></select>
	</div>
	<div class="als-sidebar" data-id="sidebar">
		<div class="als-window-sidebar-title" data-als-locale-property="${sidebarTitle}"></div>
	</div>
	<div class="als-sidebar-window-content-wrapper" data-id="content-wrapper">
		<div class="als-window-sidebar-title" data-als-locale-property="${contentTitle}"></div>
	</div>
</div>
<div class="als-items-row als-sidebar-window-button-container" data-id="buttons-wrapper">
	<div class="als-button-base" data-id="close-button" data-mobile-class="ri ri-close-line" data-als-locale-property="${closeButtonTitle}"></div>
</div>
		`, this.window);

		/**
		 * Sidebar element
		 * @type {HTMLDivElement}
		 * @private
		 */
		this._sidebar = this.window.querySelector("div[data-id='sidebar']");

		/**
		 * Select element container
		 * @type {HTMLDivElement}
		 * @private
		 */
		this._selectContainer = this.window.querySelector("div[data-id='select-container']");

		/**
		 * Select element
		 * @type {HTMLSelectElement}
		 */
		this.select = this.window.querySelector("select[data-id='select']");

		/**
		 * Close button
		 * @type {HTMLDivElement}
		 */
		this.closeButton = this.window.querySelector("div[data-id='close-button']");

		/**
		 * Div that wraps content
		 * @type {HTMLDivElement}
		 */
		this.contentWrapper = this.window.querySelector("div[data-id='content-wrapper']");
		this.contentWrapper.appendChild(this.container);

		/**
		 * Div that wraps entire window
		 * @type {HTMLDivElement}
		 */
		this.windowWrapper = this.window.querySelector("div[data-id='wrapper']");

		/**
		 * Div that contains buttons
		 * @type {HTMLDivElement}
		 */
		this.buttonsWrapper = this.window.querySelector("div[data-id='buttons-wrapper']");

		this.select.addEventListener("change", (e) => {
			this.displayItem(
				L.ALS.Locales.getLocalePropertyOrValue(e.target.options[e.target.selectedIndex])
			);
		});

		this.closeButton.addEventListener("click", () => {
			this.windowContainer.setAttribute("data-hidden", "1");
			if (onCloseCallback)
				onCloseCallback();
		})

		let onResize = () => {
			if (this._sidebarWidth === 0 || this.windowContainer.getAttribute("data-hidden") !== "0")
				return;

			let isTooWide = this.window.offsetWidth / 3 <= this._sidebarWidth;
			if (isTooWide && this._selectContainer.classList.contains("hidden")) {
				this._selectContainer.classList.remove("hidden");
				this._sidebar.classList.add("hidden");
				this.contentWrapper.style.display = "block";
				this.isSidebarHidden = true;
			} else if (!isTooWide && this.isSidebarHidden) {
				this._sidebar.classList.remove("hidden");
				this._selectContainer.classList.add("hidden");
				this.contentWrapper.style.display = "table-cell";
				this.isSidebarHidden = false;
			}
			this.updateWindowHeight();
		}
		window.addEventListener("resize", debounce(onResize, 200));
		document.body.appendChild(this.windowContainer);

		(async () => {
			// Wait until window will be added
			while (!this.isWindowVisible())
				await new Promise(resolve => setTimeout(resolve, 0));

			/**
			 * Buttons' height
			 * @type {number}
			 * @private
			 */
			this._buttonsHeight = this.buttonsWrapper.offsetHeight;

			/**
			 * Sidebar width
			 * @type {number}
			 * @private
			 */
			this._sidebarWidth = this._sidebar.offsetWidth;

			onResize();
		})();
	},

	/**
	 * Adds item to this window
	 * @param name {string} Name of the item or locale string
	 * @param item {L.ALS.Widgetable} Item to add
	 */
	addItem: function (name, item) {
		let option = document.createElement("option");
		L.ALS.Locales.localizeOrSetValue(option, name, "text");
		this.select.appendChild(option);

		let sidebarItem = document.createElement("div");
		sidebarItem.className = "als-button-base";
		sidebarItem.addEventListener("click", () => {
			this.displayItem(name);
		});
		L.ALS.Locales.localizeOrSetValue(sidebarItem, name);
		this._sidebar.appendChild(sidebarItem);

		let container = item.container;
		this.container.appendChild(container);

		this.items[name] = {
			container: container,
			sidebarItem: sidebarItem,
			selectItem: option,
			widgetable: item
		};

		debounce(() => { this.updateWindowHeight(); }, 200)();
	},

	/**
	 * Removes item from this window
	 * @param name {string} Name of the item to remove
	 */
	removeItem: function (name) {
		let item = this.items[name];
		if (!item)
			return;
		this.select.removeChild(item.selectItem);
		this._sidebar.removeChild(item.sidebarItem);
		this.container.removeChild(item.container);
	},

	/**
	 * Gets item's widgetable by item's name
	 * @param name {string} name of the item
	 * @return {L.ALS.Widgetable} Item's widgetable
	 */
	getItem: function (name) {
		return this.items[name].widgetable;
	},

	/**
	 * Displays item with given name
	 * @param name {string} Item to display
	 */
	displayItem: function (name) {
		let item = this.items[name];
		if (!item)
			return;

		item.selectItem.selected = "selected";

		for (let child of this._sidebar.children)
			child.setAttribute("data-is-selected", "0");
		item.sidebarItem.setAttribute("data-is-selected", "1");

		for (let child of this.container.children)
			child.setAttribute("data-hidden", "1");
		item.container.setAttribute("data-hidden", "0");
	},

	/**
	 * Updates window height
	 * @return {VoidFunction}
	 */
	updateWindowHeight: async function () {
		while (!this.isWindowVisible())
			await new Promise(resolve => setTimeout(resolve, 0));

		let previousOption = this.select.options[this.select.selectedIndex];
		this.maxHeight = 0;
		this.setWindowHeight("auto");
		for (let option of this.select.options) {
			option.selected = "selected";
			L.ALS.Helpers.dispatchEvent(this.select, "change");
			if (this.window.offsetHeight > this.maxHeight)
				this.maxHeight = this.window.offsetHeight;
		}
		this.setWindowHeight(this.maxHeight);
		this.displayItem(L.ALS.Locales.getLocalePropertyOrValue(previousOption));
	},

	/**
	 * Sets window height
	 * @param height {number|"auto"} Height to set
	 */
	setWindowHeight: function (height) {
		let contentHeight = height;
		if (typeof height === "number") {
			let vh = window.innerHeight * ((L.ALS.Helpers.isMobile) ?  0.99 : 0.9); // 99vh for mobile and 90vh for desktop
			if (height > vh)
				height = vh;
			contentHeight = height - this._buttonsHeight + "px";
		}

		for (let prop of ["minHeight", "height"]) {
			this.window.style[prop] = height;
			this.windowWrapper.style[prop] = contentHeight;
			this._sidebar.style[prop] = contentHeight;
		}
	},

	/**
	 * Indicates if window has been opened.
	 * @return {boolean} True, if window is now open.
	 */
	isWindowVisible: function () {
		return this.windowContainer.parentNode !== null && this.windowContainer.getAttribute("data-hidden") !== "1";
	},

});