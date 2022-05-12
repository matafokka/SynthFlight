/**
 * A class for displaying paths by parallels and meridians. Shouldn't be using for anything else.
 *
 * @class
 * @extends L.Polyline
 */
L.WrappedPolyline = L.Polyline.extend(/** @lends L.WrappedPolyline.prototype */{
	initialize: function (latlngs, options) {
		L.Util.setOptions(this, options);
		this.setLatLngs(latlngs);
	},

	setLatLngs: function (latlngs) {
		this._originalLatLngs = [];

		if (latlngs.length === 0) {
			L.Polyline.prototype.setLatLngs.call(this, this._originalLatLngs);
			return this;
		}

		let segments = [this._originalLatLngs, []], moveBy = 0, isFirstIteration = true;

		for (let segment of segments) {
			for (let i = 0; i < latlngs.length; i++) {
				let point = L.latLng(latlngs[i]).clone();

				if (isFirstIteration && !moveBy) {
					if (point.lng < -180)
						moveBy = 360;
					else if (point.lng > 180)
						moveBy = -360;
				} else if (!isFirstIteration)
					point.lng += moveBy;

				segment.push(point);
			}
			isFirstIteration = false;
		}

		L.Polyline.prototype.setLatLngs.call(this, moveBy === 0 ? this._originalLatLngs : segments);
		return this;
	},

	addLatLng: function (latLng) {
		return this.setLatLngs([...this._originalLatLngs, latLng]);
	},

	getLatLngs: function () {
		return this._originalLatLngs;
	},

	toGeoJSON: function (precision) {
		return new L.Polyline(this._originalLatLngs).toGeoJSON(precision);
	}
});