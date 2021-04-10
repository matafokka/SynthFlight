const debounce = require("debounce");

L.ALS._service.SidebarWindow = L.ALS.WidgetableWindow.extend({

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
<div class="controls-row-set als-sidebar-window-button-container" data-id="buttons-wrapper">
	<div class="button-base" data-id="close-button" data-mobile-class="las la-times" data-als-locale-property="${closeButtonTitle}"></div>
</div>
		`, this.window);

		this.sidebar = this.window.querySelector("div[data-id='sidebar']");
		this.selectContainer = this.window.querySelector("div[data-id='select-container']");
		this.select = this.window.querySelector("select[data-id='select']");
		this.closeButton = this.window.querySelector("div[data-id='close-button']");
		this.contentWrapper = this.window.querySelector("div[data-id='content-wrapper']");
		this.contentWrapper.appendChild(this.container);
		this.windowWrapper = this.window.querySelector("div[data-id='wrapper']");
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
			if (this.sidebarWidth === 0 || this.windowContainer.getAttribute("data-hidden") !== "0")
				return;

			let isTooWide = this.window.offsetWidth / 3 <= this.sidebarWidth;
			if (isTooWide && this.selectContainer.classList.contains("hidden")) {
				this.selectContainer.classList.remove("hidden");
				this.sidebar.classList.add("hidden");
				this.contentWrapper.style.display = "block";
				this.isSidebarHidden = true;
			} else if (!isTooWide && this.isSidebarHidden) {
				this.sidebar.classList.remove("hidden");
				this.selectContainer.classList.add("hidden");
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

			this.buttonsHeight = this.buttonsWrapper.offsetHeight;
			this.sidebarWidth = this.sidebar.offsetWidth;
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
		sidebarItem.className = "button-base";
		sidebarItem.addEventListener("click", () => {
			this.displayItem(name);
		});
		L.ALS.Locales.localizeOrSetValue(sidebarItem, name);
		this.sidebar.appendChild(sidebarItem);

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
	 */
	removeItem: function (name) {
		let item = this.items[name];
		if (!item)
			return;
		this.select.removeChild(item.selectItem);
		this.sidebar.removeChild(item.sidebarItem);
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

	displayItem: function (name) {
		let item = this.items[name];
		if (!item)
			return;

		item.selectItem.selected = "selected";

		for (let child of this.sidebar.children)
			child.setAttribute("data-is-selected", "0");
		item.sidebarItem.setAttribute("data-is-selected", "1");

		for (let child of this.container.children)
			child.setAttribute("data-hidden", "1");
		item.container.setAttribute("data-hidden", "0");
	},

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

	setWindowHeight: function (height) {
		let contentHeight = height;
		if (typeof height === "number") {
			let vh = window.innerHeight * 0.9; // 90vh
			if (height > vh)
				height = vh;
			contentHeight = height - this.buttonsHeight - (this.isSidebarHidden ? this.selectContainer.offsetHeight : 0) + "px";
		}

		for (let prop of ["minHeight", "height"]) {
			this.window.style[prop] = height;
			this.windowWrapper.style[prop] = contentHeight;
			this.sidebar.style[prop] = contentHeight;
		}
	},

	isWindowVisible: function () {
		return this.windowContainer.parentNode !== null && this.windowContainer.getAttribute("data-hidden") !== "1";
	},

});