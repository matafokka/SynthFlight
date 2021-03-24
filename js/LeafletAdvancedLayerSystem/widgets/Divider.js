L.ALS.Widgets.Divider = L.ALS.Widgets.BaseWidget.extend({
	initialize: function (id) {
		L.ALS.Widgets.BaseWidget.prototype.initialize.call(this, "", id, "");
		this.setConstructorArguments(id);
	},

	toHtmlElement: function () {
		let container = this.createContainer();
		container.classList.add("adv-lyr-sys-divider");
		return container;
	}
});