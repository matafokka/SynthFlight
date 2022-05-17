const RomanNumerals = require("roman-numerals");

/**
 * When map is being panned, removes previously drawn polygons and draws only visible ones.
 * This improves performance and memory consumption.
 * @private
 */
L.ALS.SynthGridLayer.prototype._onMapPan = function () {
	// Though it seems like leaflet doesn't perform any actions, we'll still won't do anything in case this behavior will change
	if (!this.isShown || !this.isDisplayed)
		return;

	this.polygonGroup.eachLayer(polygon => {
		if (!polygon.options.fill)
			this.polygonGroup.removeLayer(polygon);
	});

	this.clearLabels("gridLabelsIDs");

	// Get viewport bounds and calculate correct start and end coords for lng and lat
	let bounds = this.map.getBounds(), north = bounds.getNorth(), west = bounds.getWest(),
		lngFrom = this._closestLess(west, this.lngDistance),
		lngTo = this._closestGreater(bounds.getEast(), this.lngDistance),
		latFrom = this._closestLess(bounds.getSouth(), this.latDistance),
		latTo = this._closestGreater(north, this.latDistance);

	let isFirstIteration = true;

	let createLabel = (latLng, content, origin = "center", colorful = false) => {
		let id = L.ALS.Helpers.generateID();
		this.gridLabelsIDs.push(id);
		this.labelsGroup.addLabel(id, latLng, content, {origin: origin});
		if (colorful)
			this.labelsGroup.setLabelDisplayOptions(id, L.LabelLayer.DefaultDisplayOptions.Success);
	}

	// We will use toFixed() to generate lat and lng labels and to fix floating point errors in generating polygons' names

	for (let lat = latFrom; lat <= latTo; lat += this.latDistance) { // From bottom (South) to top (North)
		let absLat = this.toFixed(lat > 0 ? lat - this.latDistance : lat);
		createLabel([lat, west], absLat, "leftCenter", true);

		// Merge sheets when lat exceeds certain value. Implemented as specified by this document:
		// https://docs.cntd.ru/document/456074853
		let mergedSheetsCount = 1;
		if (this.shouldMergeCells) {
			absLat = Math.abs(lat);
			if (absLat > 76)
				mergedSheetsCount = (this._currentStandardScale === 200000 || this._currentStandardScale === 2000) ? 3 : 4;
			else if (absLat > 60)
				mergedSheetsCount = 2;
		}
		let lngDistance = this.lngDistance * mergedSheetsCount;

		for (let lng = lngFrom; lng <= lngTo; lng += lngDistance) { // From left (West) to right (East)
			if (lng < -180 || lng > 180 -  lngDistance)
				continue;

			if (isFirstIteration)
				createLabel([north, lng], this.toFixed(lng), "topCenter", true);

			let polygon = this.initPolygon(lat, lng, lngDistance);

			// Generate current polygon's name if grid uses one of standard scales
			if (this._currentStandardScale === Infinity) {
				polygon.polygonName = "Not in standard scale system";
				continue;
			}

			// Firstly, we round our coordinates to avoid floating-point errors.
			// Secondly, our point lies on bottom left corner. To avoid dealing with points on lines and errors related to it, we need to add some value to each coordinate.
			let fixedLat = this.toFixed(lat + this.latDistance / 2);
			let fixedLng = this.toFixed(lng + this.lngDistance / 2);

			// 1:1 000 000. This part is always present
			let index = Math.floor(Math.abs(fixedLat) / 4),
				polygonName = L.ALS.Locales.English.alphabet[index] + "-",
				number = Math.floor(fixedLng / 6) + 31,
				stackUntil = this._currentStandardScale === 1000000 ? mergedSheetsCount : 1;

			// When cells are merged, fill name with numbers
			for (let i = 0; i < stackUntil; i++) {
				polygonName += number;
				number++;
				if (i + 1 < stackUntil)
					polygonName += ",";
			}

			/**
			 * Splits a sheet of given size to given number of columns and rows.
			 * Counts parts from left to right and from top to bottom.
			 * Returns number of part containing current point with coordinates (fixedLat, fixedLng).
			 * @param colsAndRowsCount Number of both columns and rows. I.e., if you'll pass 3, it will divide sheet to 9 equal parts.
			 * @param stackNumbers {"none"|"alphabet"|"numbers"|"roman"} How to stack numbers for the last part of the polygon name
			 * @param sheetLat Size of sheet by latitude
			 * @param sheetLng Size of sheet by longitude
			 * @return {string} Number of part containing current point with coordinates (fixedLat, fixedLng)
			 */
			let sheetNumber = (colsAndRowsCount, stackNumbers = "none", sheetLat = 4, sheetLng = 6) => {
				let fixedLatScale = this.toFixed(sheetLat); // Truncate sheet sizes to avoid floating point errors.
				let fixedLngScale = this.toFixed(sheetLng);

				// Ok, imagine a ruler which looks like this: |...|...|...|. In our case, | is sheet's border. Our point lies between these borders.
				// We need to find how much borders we need to reach our point. We do that for both lat and lng.
				// Here we're finding coordinates of these borders
				let bottomLat = this.toFixed(this._closestLess(fixedLat, fixedLatScale));
				let leftLng = this.toFixed(this._closestLess(fixedLng, fixedLngScale));

				// Look at the division. Numerator is the position of our point relative to the border. Denominator represents how much degrees are in one part of the divided sheet.
				// By dividing position by number of parts, we get the number of part containing our point.
				let row = colsAndRowsCount + Math.floor((bottomLat - fixedLat) / (fixedLatScale / colsAndRowsCount)) + 1;
				let col = -Math.floor((leftLng - fixedLng) / (fixedLngScale / colsAndRowsCount));

				let stackUntil = stackNumbers === "none" ? 1 : mergedSheetsCount,
					toReturn = "",
					number = colsAndRowsCount * (row - 1) + col;

				// A hack for 1:2000 scale which I don't quite remember what for.
				if (this._currentStandardScale === 2000)
					number += number >= 6 ? -6 : +3;

				// When cells are merged, fill name with numbers
				for (let i = 0; i < stackUntil; i++) {
					switch (stackNumbers) {
						case "alphabet":
							toReturn +=  L.ALS.locale.alphabet[number - 1];
							break;
						case "roman":
							toReturn += RomanNumerals.toRoman(number);
							break;
						default:
							toReturn += number;
					}
					number++;
					if (i + 1 < stackUntil)
						toReturn += ",";
				}

				return toReturn;
			}

			if (this._currentStandardScale === 500000) // 1:500 000
				polygonName += "-" + sheetNumber(2, "numbers");
			else if (this._currentStandardScale === 300000) // 1:300 000
				polygonName = sheetNumber(3, "roman") + "-" + polygonName;
			else if (this._currentStandardScale === 200000)  // 1:200 000
				polygonName += "-" + sheetNumber(6, "roman");
			else if (this._currentStandardScale <= 100000) // 1:100 000. This part is always present if scale is less than or equal to 1:100 000.
				polygonName += "-" + sheetNumber(12, this._currentStandardScale === 100000 ? "numbers" : "none");

			if (this._currentStandardScale <= 50000 && this._currentStandardScale > 5000) {
				polygonName += "-" + sheetNumber(2, this._currentStandardScale === 50000 ? "alphabet" : "none", 2 / 6, 3 / 6); // 1:50 000. Always present.
				if (this._currentStandardScale <= 25000)
					polygonName += "-" + sheetNumber(2, this._currentStandardScale === 25000 ? "alphabet" : "none", 1 / 6, 15 / 60).toLowerCase();
				if (this._currentStandardScale <= 10000)
					polygonName += "-" + sheetNumber(2, "numbers", 5 / 60, 7.5 / 60);
			} else if (this._currentStandardScale <= 5000) {
				polygonName += " (" + sheetNumber(16, this._currentStandardScale === 5000 ? "numbers" : "none", 2 / 6, 3 / 6);
				if (this._currentStandardScale === 2000)
					polygonName += "-" + sheetNumber(3, "alphabet", (1 + 15 / 60) / 60, (1 + 52.5 / 60) / 60).toLowerCase();
				polygonName += ")";
			}

			if (lat < 0)
				polygonName += " (S)";
			polygon.polygonName = polygonName;
			createLabel([lat + this.latDistance / 2, lng + lngDistance / 2], polygonName);
		}
		isFirstIteration = false;
	}
	this.labelsGroup.redraw();

	let toBack = [this.bordersGroup, this.polygonGroup];
	for (let group of toBack)
		group.bringToBack();
}