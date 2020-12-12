L.ALS.Widgets.Number = L.ALS.Widgets.BaseWidget.extend({

	initialize: function (id, label, objectToControl = undefined, callback = "", attributes = {}) {
		L.ALS.Widgets.BaseWidget.prototype.initialize.call(this, "number", id, label, objectToControl, callback, ["edit", "change", "keyup"], attributes);
	},

	getValue: function () {
		return parseFloat(this.input.value);
	},

	onChange: function (event) {
		if (this.input.value === "")
			return false;
		let value = parseFloat(this.input.value);
		let min = parseFloat(this.input.getAttribute("min"));
		let max = parseFloat(this.input.getAttribute("max"));

		if (isNaN(value) || (!isNaN(min) && value < min) || (!isNaN(max) && value > max))
			return false;

		return true;
	}

});