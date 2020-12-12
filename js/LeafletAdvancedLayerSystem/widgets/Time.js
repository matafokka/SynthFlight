const supportsTime = require('time-input-polyfill/supportsTime');
const TimePolyfill = require('time-input-polyfill');

if (!supportsTime) {
	// Converting to an array for IE support
	let inputs = [].slice.call(document.querySelectorAll('input[type="time"]'));
	/*inputs.forEach(function ($input) {
		new TimePolyfill($input);
	})*/
	for (let i of inputs)
		new TimePolyfill(i);
}

L.ALS.Widgets.Time = L.ALS.Widgets.BaseWidget.extend({
	setValue: function (value) {
		L.ALS.Widgets.BaseWidget.prototype.setValue.call(this, value)
		if (!supportsTime)
			this.input.polyfill.update();
	}
});