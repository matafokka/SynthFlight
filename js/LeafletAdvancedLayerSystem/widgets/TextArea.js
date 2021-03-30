/**
 * Very configurable textarea widget
 */
L.ALS.Widgets.TextArea = L.ALS.Widgets.BaseWidget.extend({

	undoable: false,

	/**
	 * Constructs text widget
	 * @param id {string} ID of this text widget
	 * @param placeholder {string} Placeholder for this widget
	 * @param objectToControl {object}
	 * @param callback {string}
	 */
	initialize: function (id, placeholder = "", objectToControl = undefined, callback = "") {
		L.ALS.Widgets.BaseWidget.prototype.initialize.call(this, "", id, "", objectToControl, callback, ["edit"], {
			autocomplete: "off",
			wrap: "soft",
			placeholder: placeholder
		});
		this.setConstructorArguments(arguments);
		this.setText("");
	},

	toHtmlElement: function() {
		let container = this.createContainer();
		container.appendChild(this._createInput());
		return container;
	},

	createInputElement: function () {
		let input = document.createElement("textarea");
		input.className = "adv-lyr-sys-textarea";
		return input;
	},

	setEditable: function(isEditable) {
		this.setEnabled(isEditable);
	},

	getEditable: function(isEditable) {
		return this.getEnabled();
	},

	/**
	 * Sets maximum height (in rows) of this widget.
	 * @param rowsCount {int} Height of this widget. Set to 0 or less to disable height limit.
	 */
	setMaxHeight: function (rowsCount) {
		this.input.setAttribute("rows", rowsCount);
	},

	/**
	 * Sets whether this textarea will use monotype or sans font
	 * @param isMonotype {boolean} If true, textarea will use monotype font. Sans font will be used otherwise.
	 */
	setMonotype: function (isMonotype) {
		let className = "adv-lyr-sys-textarea-mono";
		if (isMonotype)
			this.input.classList.add(className);
		else
			this.input.classList.remove(className);
	},

	/**
	 * Alias for setValue()
	 * @param text {string} Text to set to this textarea
	 */
	setText: function (text) {
		this.setValue(text);
	},

	/**
	 * Alias for getValue()
	 * @return {string} Text in this textarea
	 */
	getText: function () {
		return this.getValue();
	},

	/**
	 * Appends text to this textarea. This is convenience function for setText(getText() + text);
	 * @param text {string} Text to append
	 */
	appendText: function (text) {
		this.input.value += text;
	},

	/**
	 * Appends row to this textarea. This is a convenience function.
	 * @param text {string} Text to append in a new row
	 * @param insertLineBreak {boolean} If set to true, will additionally append a line break after the given text
	 */
	appendRow: function (text, insertLineBreak = false) {
		this.input.value += "\n" + text;
		if (insertLineBreak)
			this.input.value += "\n";
	},

	statics: {
		/**
		 * A convenience function to create a console
		 * @param id {string} ID of a console
		 * @param rowCount {int} Maximum height of the console in number of rows
		 * @return {L.ALS.Widgets.TextArea} Textarea widget that looks like a console
		 */
		createConsole(id = "console", rowCount = 0) {
			let consoleWidget = new L.ALS.Widgets.TextArea("console", "");
			consoleWidget.setEditable(false);
			consoleWidget.setMonotype(true);
			consoleWidget.setMaxHeight(rowCount);
			return consoleWidget;
		}
	}

});