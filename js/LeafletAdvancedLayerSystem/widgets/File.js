L.ALS.Widgets.File = L.ALS.Widgets.BaseWidget.extend({

	undoable: false,

	/**
	 * Constructs File input widget
	 */
	initialize: function (id, label, objectToControl= undefined, callback = "") {
		L.ALS.Widgets.BaseWidget.prototype.initialize.call(this, "file", id, label, objectToControl, callback, ["input"]);
		this.setConstructorArguments(arguments);
		this.input.addEventListener("input", () => { this._updateFileArea(); });
	},

	toHtmlElement: function () {
		let container = L.ALS.Widgets.BaseWidget.prototype.toHtmlElement.call(this);
		this.fileArea = document.createElement("label");
		this.fileArea.htmlFor = this.input.id;
		this.fileArea.className = "button-base adv-lyr-sys-file-area";
		this.input.parentNode.appendChild(this.fileArea);
		this._updateFileArea();
		return container;
	},

	_updateFileArea: function () {
		let files = this.getValue();
		if (files === undefined || files.length === 0) {
			this.fileArea.innerHTML = "No files selected. Click here to select some files.";
			return;
		}
		if (!this.input.hasAttribute("multiple")) {
			this.fileArea.innerHTML = "Selected file: " + files[0].name;
			return;
		}

		let value = "Selected files: ";
		for (let file of files)
			value += file.name + "; ";
		value = value.slice(0, value.length - 2) + ".";
		this.fileArea.innerHTML = value;
	},

	/**
	 * Sets whether this file widget should allow selecting multiple files or not.
	 * @param isMultiple {boolean} If true, user will be able to select multiple files.
	 */
	setMultiple: function (isMultiple) {
		if (isMultiple)
			this.input.setAttribute("multiple", "");
		else
			this.input.removeAttribute("multiple");
		this._updateFileArea();
	},

	/**
	 * @return {boolean} True, if user is able to select multiple files. False otherwise.
	 */
	getMultiple: function () {
		return this.input.hasAttribute("multiple");
	},

	/**
	 * Does nothing
	 */
	setValue: function () {},

	/**
	 * @return {FileList} FileList object containing all selected files
	 */
	getValue: function () {
		return this.input.files;
	}

});