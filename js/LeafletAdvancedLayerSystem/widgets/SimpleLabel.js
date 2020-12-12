/**
 * Simple label that displays text
 */
L.ALS.Widgets.SimpleLabel = L.ALS.Widgets.BaseWidget.extend({

	/**
	 * Constructs label
	 * @param id {string} ID of this label
	 * @param value {string} Initial text for this label
	 * @param textAlign {"left"|"right"|"center"|"justify"} Initial text align
	 * @param style {"nostyle"|"message"|"success"|"warning"|"error"} Style of this label
	 */
	initialize: function (id, value ="", textAlign= "left", style="nostyle") {
		L.ALS.Widgets.BaseWidget.prototype.initialize.call(this, "", id, "");
		this.setValue(value);
		this.setTextAlign(textAlign);

		this._styleNames = ["message", "success", "warning", "error"];
	},

	toHtmlElement: function () {
		let container = this.createContainer();
		container.appendChild(this._createInput());
		return container;
	},

	createInputElement: function () {
		let element = document.createElement("div");
		element.className = "adv-lyr-sys-simple-label";
		return element;
	},

	setValue: function (value) {
		this.input.innerText = value;

		let display = "";
		if (value === "")
			display = "none";
		this.container.style.display = display;
	},

	getValue: function () {
		return this.input.innerText;
	},

	/**
	 * @param textAlign {"left"|"right"|"center"|"justify"} Text align
	 */
	setTextAlign: function (textAlign) {
		this.input.style.textAlign = textAlign;
	},

	getTextAlign: function () {
		return this.input.style.textAlign;
	},

	/**
	 * Sets style of this label
	 * @param style {"nostyle"|"message"|"success"|"warning"|"error"} Style of this label
	 */
	setStyle: function (style) {
		for (let s of this._styleNames)
			this.input.classList.remove(s);
		if (style === "nostyle")
			return;
		this.input.classList.add(style);
	}

})