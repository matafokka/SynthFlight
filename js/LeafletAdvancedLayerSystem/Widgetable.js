/**
 * Base class for all classes that can have widgets.
 * @type {Widgetable}
 */
L.ALS.Widgetable = L.Class.extend({

	/**
	 * Initializes this object.
	 * @param className {string} Class name for the container
	 */
	initialize: function (className = "") {
		this.container = document.createElement("div");
		if (className !== "")
			this.container.className = className;
		this._widgets = {}
	},

	/**
	 * Adds widget to the container
	 * @param widget Control to add
	 */
	addWidget: function (widget) {
		this.container.appendChild(widget.container);
		this._widgets[widget.id] = widget;
	},

	/**
	 * Removes widget from the container
	 * @param id
	 */
	removeWidget: function (id) {
		let container = this._widgets[id].getContainer();
		container.parentNode.removeChild(container);
		delete this._widgets[id];
	},

	/**
	 * Removes all widgets from the container
	 */
	removeAllWidgets: function () {
		while (this.container.hasChildNodes())
			this.container.removeChild(this.container.firstChild);
		this._widgets = {};
	},

	/**
	 * Finds control for this layer by id
	 * @param id id of a control to find
	 * @return {HTMLInputElement} Control with given id.
	 */
	getControlById: function(id) {
		return this._widgets[id];
	},

});