const debounce = require("debounce");

L.ALS._service.SidebarWindow = L.ALS.WidgetableWindow.extend({

	maxHeight: 0,
	sidebarWidth: 0,

	initialize: function (button, sidebarTitle, contentTitle, closeButtonTitle="Cancel", onCloseCallback = undefined) {
		L.ALS.WidgetableWindow.prototype.initialize.call(this, button);
		this.items = {};
		this.window.classList.add("adv-lyr-sys-sidebar-window");

		L.ALS.Helpers.HTMLToElement(`
<div class="adv-lyr-sys-sidebar-window-wrapper" data-id="wrapper">
	<div class="hidden" data-id="select-container">
		<div class="adv-lyr-sys-window-sidebar-title">${sidebarTitle}</div>
		<select class="adv-lyr-sys-window-select" data-id="select"></select>
	</div>
	<div class="adv-lyr-sys-sidebar" data-id="sidebar">
		<div class="adv-lyr-sys-window-sidebar-title">${sidebarTitle}</div>
	</div>
	<div class="adv-lyr-sys-sidebar-window-content-wrapper" data-id="content-wrapper">
		<div class="adv-lyr-sys-window-sidebar-title">${contentTitle}</div>
	</div>
</div>
<div class="controls-row-set adv-lyr-sys-sidebar-window-button-container" data-id="buttons-wrapper">
	<div class="button-base" data-id="close-button">${closeButtonTitle}</div>
</div>
		`, this.window);

		this.sidebar = this.window.querySelector("div[data-id='sidebar']");
		let selectContainer = this.window.querySelector("div[data-id='select-container']");
		this.select = this.window.querySelector("select[data-id='select']");
		this.closeButton = this.window.querySelector("div[data-id='close-button']");
		let contentWrapper = this.window.querySelector("div[data-id='content-wrapper']");
		contentWrapper.appendChild(this.container);

		this.select.addEventListener("change", (e) => {
			this.displayItem(e.target.value);
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
			if (isTooWide && selectContainer.classList.contains("hidden")) {
				selectContainer.classList.remove("hidden");
				this.sidebar.classList.add("hidden");
				contentWrapper.style.display = "block";
			} else if (!isTooWide && this.sidebar.classList.contains("hidden")) {
				this.sidebar.classList.remove("hidden");
				selectContainer.classList.add("hidden");
				contentWrapper.style.display = "table-cell";
			}
			this.updateWindowHeight();
		}
		window.addEventListener("resize", debounce(onResize, 200));
		document.body.appendChild(this.windowContainer);

		(async () => {
			// Wait until window will be added
			while (!this.isWindowVisible())
				await new Promise(resolve => setTimeout(resolve, 0));

			this.sidebarWidth = this.sidebar.offsetWidth;
			onResize();
		})();
	},

	/**
	 * Adds item to this window
	 * @param name {string} name of the item
	 * @param item {L.ALS.Widgetable} Item to add
	 */
	addItem: function (name, item) {
		let option = document.createElement("option");
		option.text = name;
		this.select.appendChild(option);

		let sidebarItem = document.createElement("div");
		sidebarItem.className = "button-base";
		sidebarItem.innerText = name;
		sidebarItem.addEventListener("click", () => {
			this.displayItem(name);
		});
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

		for (let option of this.select.options) {
			if (option.value === name) {
				option.selected = "selected";
				break;
			}
		}

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

		let previousOption = this.select.value;
		this.maxHeight = 0;
		this.setWindowHeight("auto");
		for (let option of this.select.options) {
			option.selected = "selected";
			L.ALS.Helpers.dispatchEvent(this.select, "change");
			if (this.window.offsetHeight > this.maxHeight)
				this.maxHeight = this.window.offsetHeight;
		}
		this.setWindowHeight(this.maxHeight);
		this.displayItem(previousOption);
	},

	setWindowHeight: function (height) {
		if (typeof height === "number") {
			let vh = window.innerHeight * 0.9; // 90vh
			if (height > vh)
				height = vh;
			height = height + "px";
		}

		for (let item of ["window", "sidebar"]) {
			for (let prop of ["minHeight", "height"])
				this[item].style[prop] = height;
		}
	},

	isWindowVisible: function () {
		return this.windowContainer.parentNode !== null && this.windowContainer.getAttribute("data-hidden") !== "1";
	}

});