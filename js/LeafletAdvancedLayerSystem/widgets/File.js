/**
 * File input widget
 *
 * @param id {string} ID of this input. You can select this object using this ID.
 * @param label {string} Label for this input. You can also pass locale property to localize the label.
 * @param callbackObject {Object|L.ALS.Serializable} Object which contains callback. Just pass "this". If you plan to use serialization, this object MUST be instance of L.ALS.Serializable.
 * @param callback {string} Name of the method of callbackObject that will be called when widget's value changes
 *
 * @class
 * @extends L.ALS.Widgets.BaseWidget
 */
L.ALS.Widgets.File = L.ALS.Widgets.BaseWidget.extend( /** @lends L.ALS.Widgets.File.prototype */ {

	undoable: false,

	initialize: function (id, label, callbackObject= undefined, callback = "") {
		L.ALS.Widgets.BaseWidget.prototype.initialize.call(this, "file", id, label, callbackObject, callback, ["input"]);
		this.setConstructorArguments(arguments);
		this.input.addEventListener("input", () => { this._updateFileArea(); });
	},

	toHtmlElement: function () {
		let container = L.ALS.Widgets.BaseWidget.prototype.toHtmlElement.call(this);

		/**
		 * Clickable area that contains selected files' names
		 * @type {HTMLLabelElement}
		 * @private
		 */
		this._fileArea = document.createElement("label");
		this._fileArea.htmlFor = this.input.id;
		this._fileArea.className = "als-button-base als-file-area";
		this.input.parentNode.appendChild(this._fileArea);
		this._updateFileArea();
		return container;
	},

	/**
	 * Updates file area DIV whenever user selects files or this widget changes to accept multiple files
	 * @private
	 */
	_updateFileArea: function () {
		let files = this.getValue();
		if (files === undefined || files.length === 0) {
			L.ALS.Locales.localizeElement(this._fileArea, "fileNoFilesSelected");
			return;
		}
		if (!this.input.hasAttribute("multiple")) {
			L.ALS.Locales.localizeElement(this._fileArea, "fileSelectedFile");
			this._fileArea.innerText += " " + files[0].name;
			return;
		}

		let value = "Selected files: ";
		for (let file of files)
			value += file.name + "; ";
		value = value.slice(0, value.length - 2) + ".";
		this._fileArea.innerHTML = value;
	},

	/**
	 * Sets whether this file widget should allow selecting multiple files or not.
	 * @param isMultiple {boolean} If true, user will be able to select multiple files.
	 * @return {L.ALS.Widgets.File} This
	 */
	setMultiple: function (isMultiple) {
		if (isMultiple)
			this.input.setAttribute("multiple", "");
		else
			this.input.removeAttribute("multiple");
		this._updateFileArea();
		return this;
	},

	/**
	 * @return {boolean} True, if this widget is set to accept multiple files. False otherwise.
	 */
	getMultiple: function () {
		return this.input.hasAttribute("multiple");
	},

	/**
	 * Does nothing
	 * @return {L.ALS.Widgets.File} This
	 */
	setValue: function () {
		return this;
	},

	/**
	 * @return {FileList} FileList object containing all selected files
	 */
	getValue: function () {
		return this.input.files;
	}

});