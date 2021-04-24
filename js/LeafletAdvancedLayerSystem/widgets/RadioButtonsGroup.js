/**
 * Represents set of radio buttons.
 *
 * @param id {string} ID of this input. You can select this object using this ID.
 * @param label {string} Label for this input. You can also pass locale property to localize the label.
 * @param callbackObject {Object|L.ALS.Serializable} Object which contains callback. Just pass "this". If you plan to use serialization, this object MUST be instance of L.ALS.Serializable.
 * @param callback {string} Name of the method of callbackObject that will be called when widget's value changes
 *
 * @class
 * @extends L.ALS.Widgets.BaseItemsWidget
 */
L.ALS.Widgets.RadioButtonsGroup = L.ALS.Widgets.BaseItemsWidget.extend( /** @lends L.ALS.Widgets.RadioButtonsGroup.prototype */ {

	initialize: function (id, label, callbackObject = undefined, callback = "") {
		L.ALS.Widgets.BaseWidget.prototype.initialize.call(this, "", id, label, callbackObject, callback, ["change"]);
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
		return this;
	},

	removeItem: function (item) {
		let container = this._getButtonsContainer(item);
		if (!container)
			return;
		this.container.removeChild(container);
		return this;
	},

	selectItem: function (item) {
		let container = this._getButtonsContainer(item);
		if (!container)
			return;
		container.getElementsByTagName("input")[0].checked = true;
		return this;
	},

	getValue: function () {
		for (let child of this.container.getElementsByTagName("input")) {
			if (child.checked)
				return L.ALS.Locales.getLocalePropertyOrValue(this.container.querySelector(`label[data-radio-id="${child.getAttribute("data-radio-id")}"]`));
		}
	},

	_getButtonsContainer: function (item) {
		return this.container.querySelector(`div[data-radio-id="${item}"]`);
	}

});