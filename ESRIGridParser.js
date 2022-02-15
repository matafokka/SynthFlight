const MathTools = require("./MathTools.js");
const proj4 = require("proj4");

/**
 * A stateful ESRI Grid parser. Calculates min and max values for selected polygons in {@link L.ALS.SynthPolygonLayer}. Can parse huge files by chunks.
 */
class ESRIGridParser {

	/**
	 * Constructs a ESRI Grid parser.
	 *
	 * @param layer {L.ALS.SynthPolygonLayer} A layer to apply parsed values to.
	 * @param projectionString {string} Proj4 projection string. If not given, WGS84 assumed.
	 */
	constructor(layer = undefined, projectionString = "") {

		/**
		 * Layer to apply parsed values to
		 * @type {L.ALS.SynthPolygonLayer}
		 */
		this.layer = layer

		/**
		 * Proj4 projection string
		 * @type {boolean}
		 */
		this.hasProj = (projectionString !== "");

		if (this.hasProj)
			/**
			 * Proj4 projection object. Projects coordinates from WGS84 to grids projection.
			 * @type {Object|undefined}
			 */
			this.projectionFromWGS = proj4("WGS84", projectionString);

		this.clearState();
	}

	/**
	 * Clears current state and prepares polygons again. Call it before reusing parser.
	 */
	clearState() {
		/**
		 * Contains parameters
		 * @property {number|undefined} xllcenter Longitude of a center
		 * @property {number|undefined} yllcenter Latitude of a center
		 * @property {number|undefined} xllcorner Longitude of a bottom left corner
		 * @property {number|undefined} yllcorner Latitude of a bottom left corner
		 * @property {number} nrows Number of rows
		 * @property {number} ncols Number of columns
		 * @property {number} nodata_value A value which represents missing data for a pixel
		 * @property {number} cellsize Pixel size in degrees
		 * @type {Object}
		 */
		this.DEMParams = {};

		/**
		 * Indicates whether parser is currently reading parameter's name
		 * @type {boolean}
		 */
		this.readingDEMParamName = true;

		/**
		 * Indicates whether parser already read all parameters
		 * @type {boolean}
		 */
		this.allDEMParamsRead = false;

		/**
		 * Indicates whether additional parameters has been calculated
		 * @type {boolean}
		 */
		this.DEMParamsCalculated = false;

		/**
		 * Parameter name that currently is being read
		 * @type {string}
		 */
		this.param = "";

		/**
		 * Whatever value that currently is being read
		 * @type {string}
		 */
		this.value = "";

		/**
		 * Current Y coordinate. Changes when statistics is being calculated.
		 * @type {number}
		 */
		this.y = 0;

		/**
		 * Current X coordinate. Changes when statistics is being calculated.
		 * @type {number}
		 */
		this.x = 0;

		/**
		 * Statistics for each selected polygon where keys are polygons' names and values are objects with `min` and `max` keys.
		 * @type {Object}
		 */
		this.polygonsStats = {};

		/**
		 * Contains polygons' coordinates mapped by polygons' names.
		 * @type {Object}
		 */
		this.polygonsCoordinates = {};

		this.isPreviousLineBreak = false;

		this.isPreviousSpace = false;

		if (!this.layer)
			return;

		// Turn polygons into rectangles beforehand to optimize calculations
		this.polygonsCoordinates = ESRIGridParser.getInitialData(this.layer);
	}


	/**
	 * Reads a chunk
	 * @param chunk {string} A chunk to read
	 */
	readChunk(chunk) {
		for (let i = 0; i < chunk.length; i++) {
			let symbol = chunk[i].toLowerCase();
			let isSpace = (symbol === " "), isLineBreak = (symbol === "\n" || symbol === "\r");

			// Skip multiple spaces and line breaks
			let nameMap = [
				["isPreviousLineBreak", isLineBreak],
				["isPreviousSpace", isSpace],
			];
			let doSkip = false;
			for (let record of nameMap) {
				let name = record[0];
				if (record[1]) {
					doSkip = this[name];
					this[name] = true;
				} else
					this[name] = false;
			}

			if (doSkip)
				continue;

			// Read parameters
			if (!this.allDEMParamsRead) {
				// Read param name until we hit space
				if (this.readingDEMParamName) {
					if (symbol === " ")
						this.readingDEMParamName = false;
					// Stop reading when we hit minus or digit
					else if (symbol === "-" || !isNaN(parseInt(symbol))) {
						this.value = symbol;
						this.allDEMParamsRead = true;
					} else
						this.param += symbol;
				}

				// Read param value
				else {
					// There might be multiple spaces before the value
					if (isSpace)
						continue;

					// If we hit line break, the value has been read
					if (isLineBreak) {
						this.DEMParams[this.param.trim()] = parseFloat(this.value); // Trailing \r might have been left, need to trim it. Also, different programs are using different case, so we gotta normalize it.
						this.param = "";
						this.value = "";
						this.readingDEMParamName = true;
					} else
						this.value += symbol;
				}
				continue;
			}

			// Calculate params
			if (!this.DEMParamsCalculated) {
				// Calculate top left corner coordinates
				if (this.DEMParams.xllcenter) { // If center is given
					this.DEMParams.topLeft = {
						x: this.DEMParams.xllcenter - (this.DEMParams.ncols * this.DEMParams.cellsize) / 2,
						y: this.DEMParams.yllcenter + (this.DEMParams.nrows * this.DEMParams.cellsize) / 2,
					}
				} else { // If bottom left is given
					this.DEMParams.topLeft = {
						x: this.DEMParams.xllcorner,
						y: this.DEMParams.yllcorner + (this.DEMParams.nrows * this.DEMParams.cellsize),
					}
				}
				this.x = this.DEMParams.topLeft.x;
				this.y = this.DEMParams.topLeft.y;

				if (!this.DEMParams.nodata_value)
					this.DEMParams.nodata_value = -9999;

				/*let rect = L.rectangle([
					[this.y, this.x],
					[this.y - this.DEMParams.nrows * this.DEMParams.cellsize, this.x + this.DEMParams.ncols * this.DEMParams.cellsize]
				], {color: "#ff7800", weight: 2});
				this.layer.addLayers(rect);*/

				this.DEMParamsCalculated = true;
			}

			// Read values and calculate statistics

			let valueNotEmpty = (this.value !== "");

			if ((isSpace || isLineBreak) && valueNotEmpty) {
				let pixelValue = parseFloat(this.value.trim()); // Some programs leaves spaces after last symbol. Also, there might be a trailing \r.
				if (pixelValue === this.DEMParams.nodata_value) {
					this._updateCoordinates(isLineBreak, isSpace);
					continue;
				}

				let oldPoint = [this.x, this.y];
				let point = (this.hasProj) ? this.projectionFromWGS.inverse(oldPoint) : oldPoint;
				for (let name in this.polygonsCoordinates) {
					if (!MathTools.isPointInRectangle(point, this.polygonsCoordinates[name]))
						continue;

					if (!this.polygonsStats[name])
						this.polygonsStats[name] = ESRIGridParser.createStatsObject();

					let stats = this.polygonsStats[name];
					ESRIGridParser.addToStats(pixelValue, stats);
				}
			} else if (!isSpace && !isLineBreak)
				this.value += symbol;

			this._updateCoordinates(isLineBreak, isSpace);
		}
	}

	/**
	 * Clears current value and updates coordinates
	 * @param isLineBreak {boolean} Indicates whether current symbol is a line break
	 * @param isSpace {boolean} Indicates whether current symbol is a space
	 * @private
	 */
	_updateCoordinates(isLineBreak, isSpace) {
		if (!isLineBreak && !isSpace)
			return;
		this.value = "";
		if (isLineBreak) {
			this.x = this.DEMParams.topLeft.x;
			this.y -= this.DEMParams.cellsize;
		} else if (isSpace)
			this.x += this.DEMParams.cellsize;
	}

	/**
	 * Copies statistics to the polygons and clears state. Call it when you finish reading file.
	 *
	 * This method is NOT thread-safe! Call it outside of your WebWorker and pass your layer as an argument.
	 *
	 * @param layer {L.ALS.SynthPolygonLayer} If you're not using it in a WebWorker, don't pass anything. Otherwise, pass your layer.
	 */
	copyStats(layer = undefined) {
		let l = this.layer || layer;
		if (!l)
			throw new Error("Can't copy statistics. If you're using ESRIGridParser in a WebWorker, call this method outside of WebWorker!");
		ESRIGridParser.copyStats(l, this.polygonsStats);
		this.clearState();
	}

	/**
	 * Parses given file
	 * @param file {File} File to parse
	 * @param parser {ESRIGridParser} An parser instance such as `new ESRIGridParser(this)`.
	 * @param fileReader {FileReader} A FileReader instance. Just pass `new FileReader()`.
	 * @param callback {function} This function will be called when reading will be finished.
	 */
	static parseFile(file, parser, fileReader = new FileReader(), callback = undefined) {
		let offset = 0, size = 1048576;
		fileReader.onloadend = (e) => {
			parser.readChunk(e.target.result);
			offset += size;
			this._nextChunk(file, fileReader, size, offset, parser, callback);
		};
		this._nextChunk(file, fileReader, size, offset, parser, callback);
	}

	/**
	 * Constructs a new chunk of a file and passes it to the FileReader
	 * @param file {File} File to use
	 * @param fileReader {FileReader} FileReader instance
	 * @param size {number} Chunk size
	 * @param offset {number} Current chunk offset
	 * @param parser {ESRIGridParser} A parser instance
	 * @param callback {function(Object)} Callback that accepts statistics as an argument.
	 * @private
	 */
	static _nextChunk(file, fileReader, size, offset, parser, callback) {
		if (offset >= file.size) {
			if (callback)
				callback(parser.polygonsStats);
			if (parser.layer)
				parser.copyStats();
			return;
		}
		let blob = file.slice(offset, size + offset);
		fileReader.readAsText(blob);
	}

	/**
	 * Generates initial parameters for the layer.
	 * @param layer {L.ALS.SynthPolygonLayer} Layer to copy data from
	 */
	static getInitialData(layer) {
		let polygonsCoordinates = {};
		for (let name in layer.polygons) {
			if (!layer.polygons.hasOwnProperty(name))
				continue;

			let rect = layer.polygons[name].getBounds();
			polygonsCoordinates[name] = [
				[rect.getWest(), rect.getNorth()],
				[rect.getEast(), rect.getSouth()]
			];
		}
		return polygonsCoordinates;
	}

	/**
	 * Copies stats from any ESRIGridParser to a given layer
	 * @param layer {L.ALS.SynthPolygonLayer} Layer to copy stats to
	 * @param stats {Object} Stats from any ESRIGridParser
	 */
	static copyStats(layer, stats) {
		for (let name in stats) {
			let widgetable = layer.polygonsWidgets[name];
			let s = stats[name];
			s.mean = s.sum / s.count;
			widgetable.getWidgetById("minHeight").setValue(s.min);
			widgetable.getWidgetById("maxHeight").setValue(s.max);
			widgetable.getWidgetById("meanHeight").setValue(s.mean);
		}
		layer.updateAll();
	}

	static createStatsObject() {
		return {min: Infinity, max: -Infinity, mean: 0, sum: 0, count: 0}
	}

	static addToStats(value, stats) {
		if (value < stats.min)
			stats.min = value;
		if (value > stats.max)
			stats.max = value;
		stats.sum += value;
		stats.count++;
	}

}

module.exports = ESRIGridParser;