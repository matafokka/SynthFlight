/**
 * A group of buttons that will be nicely wrapped if user's browser supports flexboxes or will be displayed as a single column in other browsers.
 */
L.ALS.Widgets.ButtonsGroup = L.ALS.Widgets.ItemsWidgetInterface.extend({

	initialize: function (id) {
		L.ALS.Widgets.BaseWidget.prototype.initialize.call(this, "", id, "");
		this._items = {};
	},

	toHtmlElement: function () {
		let container = this.createContainer();
		container.classList.add("als-buttons-group-wrapper");
		return container;
	},

	/**
	 * Adds a button to this group. Basically, acts as L.ALS.Widgets.Button factory so it accepts almost all of it's constructor arguments.
	 * @param item {string} Name and text of the button. You can pass locale property to localize it.
	 * @param objectToControl {Object|L.ALS.Serializable} Just pass "this". If you plan to use serialization, this object MUST be instance of L.ALS.Serializable.
	 * @param callback {string} Name of a method of objectToControl that will be called when button will be pressed.
	 * @param mobileIcon {string} class appended to new button if user's device is a phone. Can be used for setting an icon instead of text to save up space and avoid word wrapping. You can use Remix Icon classes to do so. Or you can install your own icon pack (not recommended due to inconsistency) and use it this way.
	 */
	addItem: function (item, objectToControl = undefined, callback = "", mobileIcon = "") {
		let button = new L.ALS.Widgets.Button(item, item, objectToControl, callback, mobileIcon);
		this.container.appendChild(button.container);
		this._items[item] = button;
	},

	/**
	 * Finds and returns button in this group
	 * @param item {string} Name of the button
	 * @return {L.ALS.Widgets.Button} Found button or undefined if there's no specified button
	 */
	getItem: function (item) {
		return this._items[item];
	},

	removeItem: function (item) {
		this.container.removeChild(this._items[item]);
		delete this._items[item];
	}

});