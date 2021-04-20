L.ALS.Widgets.RadioButtonsGroup = L.ALS.Widgets.ItemsWidgetInterface.extend({

	initialize: function (id, label, objectToControl, callback) {
		L.ALS.Widgets.BaseWidget.prototype.initialize.call(this, "", id, label, objectToControl, callback, ["change"]);
		this.radioNames = L.ALS.Helpers.generateID();
		this.containerForRevertButton = this.container.getElementsByClassName("als-radio-label-wrapper")[0];
		this.setConstructorArguments(arguments);
	},

	toHtmlElement: function () {
		let container = this.createContainer();
		container.classList.add("als-radio-group-wrapper");
		let labelWrapper = document.createElement("div");
		labelWrapper.className = "als-radio-label-wrapper";
		labelWrapper.appendChild(this.createLabel());
		container.appendChild(labelWrapper);
		return container;
	},

	addItem: function (item) {
		let itemWrapper = document.createElement("div");
		itemWrapper.className = "als-widget-row";

		let radioWrapper = document.createElement("div");
		radioWrapper.className = "als-input als-checkbox-wrapper";

		let radio = document.createElement("input");
		radio.type = "radio";
		radio.name = this.radioNames;
		radio.id = L.ALS.Helpers.generateID();
		radio.className = "hidden";
		radioWrapper.appendChild(radio);

		let radioVisualElement = document.createElement("label");
		radioVisualElement.htmlFor = radio.id;
		radioVisualElement.className = "ri ri-check-line";
		radioWrapper.appendChild(radioVisualElement);

		let label = document.createElement("label");
		label.htmlFor = radio.id;
		label.className = "als-label";
		L.ALS.Locales.localizeOrSetValue(label, item);

		radio.addEventListener("change", () => {
			if (radio.checked)
				this.callCallback();
		});

		itemWrapper.appendChild(radioWrapper);
		itemWrapper.appendChild(label);
		this.container.appendChild(itemWrapper);

		for (let e of [itemWrapper, radio, label])
			e.setAttribute("data-radio-id", item);

		this.callCallback();
	},

	removeItem: function (item) {
		let container = this._getContainer(item);
		if (!container)
			return;
		this.container.removeChild(container);
	},

	selectItem: function (item) {
		let container = this._getContainer(item);
		if (!container)
			return;
		container.getElementsByTagName("input")[0].checked = true;
	},

	getValue: function () {
		for (let child of this.container.getElementsByTagName("input")) {
			if (child.checked)
				return L.ALS.Locales.getLocalePropertyOrValue(this.container.querySelector(`label[data-radio-id="${child.getAttribute("data-radio-id")}"]`));
		}
	},

	_getContainer: function (item) {
		return this.container.querySelector(`div[data-radio-id="${item}"]`);
	}

});