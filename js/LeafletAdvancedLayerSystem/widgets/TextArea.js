/**
 * Very configurable text area widget
 *
 * @param id {string} ID of this text widget
 * @param placeholder {string} Placeholder for this widget
 * @param callbackObject {Object|L.ALS.Serializable} Object which contains callback. Just pass "this". If you plan to use serialization, this object MUST be instance of L.ALS.Serializable.
 * @param callback {string} Name of the method of callbackObject that will be called when widget's value changes
 *
 * @class
 * @extends L.ALS.Widgets.BaseWidget
 */
L.ALS.Widgets.TextArea = L.ALS.Widgets.BaseWidget.extend( /** @lends L.ALS.Widgets.TextArea.prototype */ {

	undoable: false,

	initialize: function (id, placeholder = "", callbackObject = undefined, callback = "") {
		L.ALS.Widgets.BaseWidget.prototype.initialize.call(this, "", id, "", callbackObject, callback, ["edit"], {
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
		input.className = "als-textarea";
		return input;
	},

	/**
	 * Sets whether this text area should be editable by the user
	 * @param isEditable {boolean} If true, text area will be editable.
	 * @return {L.ALS.Widgets.TextArea} This
	 */
	setEditable: function(isEditable) {
		this.setEnabled(isEditable);
		return this;
	},

	/**
	 * @return {boolean} True, if this text area is editable by the user.
	 */
	getEditable: function() {
		return this.getEnabled();
	},

	/**
	 * Sets maximum height (in rows) of this widget.
	 * @param rowsCount {number} Height of this widget. Set to 0 or less to disable height limit.
	 * @return {L.ALS.Widgets.TextArea} This
	 */
	setMaxHeight: function (rowsCount) {
		this.input.setAttribute("rows", rowsCount);
		return this;
	},

	/**
	 * Sets whether this textarea will use monospace or sans font
	 * @param isMonospace {boolean} If true, textarea will use monospace font. Sans font will be used otherwise.
	 * @return {L.ALS.Widgets.TextArea} This
	 */
	setMonospace: function (isMonospace) {
		let className = "als-textarea-mono";
		if (isMonospace)
			this.input.classList.add(className);
		else
			this.input.classList.remove(className);
		return this;
	},

	/**
	 * Alias for setValue()
	 * @param text {string} Text to set to this textarea
	 * @return {L.ALS.Widgets.TextArea} This
	 */
	setText: function (text) {
		this.setValue(text);
		return this; // IDE is mad at type mismatch. Oh, boy, do I hate when I can't just write "@return {this}"
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
	 * @return {L.ALS.Widgets.TextArea} This
	 */
	appendText: function (text) {
		this.input.value += text;
		return this;
	},

	/**
	 * Appends row to this textarea. This is a convenience function.
	 * @param text {string} Text to append in a new row
	 * @param insertLineBreak {boolean} If set to true, will additionally append a line break after the given text
	 * @return {L.ALS.Widgets.TextArea} This
	 */
	appendRow: function (text, insertLineBreak = false) {
		this.input.value += "\n" + text;
		if (insertLineBreak)
			this.input.value += "\n";
		return this;
	},

	statics: {
		/**
		 * A convenience function to create a console
		 * @param id {string} ID of a console
		 * @param rowCount {int} Maximum height of the console in number of rows
		 * @return {L.ALS.Widgets.TextArea} Textarea widget that looks like a console
		 * @memberOf L.ALS.Widgets.TextArea
		 */
		createConsole(id = "console", rowCount = 0) {
			let consoleWidget = new L.ALS.Widgets.TextArea("console", "");
			consoleWidget.setEditable(false);
			consoleWidget.setMonospace(true);
			consoleWidget.setMaxHeight(rowCount);
			return consoleWidget;
		}
	}

});