// Methods related to DEM loading

const ESRIGridParser = require("../ESRIGridParser.js");
const ESRIGridParserWorker = require("../ESRIGridParserWorker.js");
const proj4 = require("proj4");
let GeoTIFFParser;
try {
	GeoTIFFParser = require("../GeoTIFFParser.js");
} catch (e) {}
const work = require("webworkify");

L.ALS.SynthPolygonBaseLayer.prototype.onDEMLoad = async function (widget) {
	let clear = () => {
		L.ALS.operationsWindow.removeOperation("dem");
		widget.clearFileArea();
	}

	if (!window.confirm(L.ALS.locale.confirmDEMLoading)) {
		clear();
		return;
	}

	L.ALS.operationsWindow.addOperation("dem", "loadingDEM");
	await new Promise(resolve => setTimeout(resolve, 0));

	// For old browsers that doesn't support FileReader
	if (!window.FileReader) {
		L.ALS.Helpers.readTextFile(widget.input, L.ALS.locale.notGridNotSupported, (grid) => {
			let parser = new ESRIGridParser(this);
			try {
				parser.readChunk(grid);
			} catch (e) {
				this.showDEMError([widget.input.files[0].name]);
				return;
			}
			parser.copyStats();
			clear();
		});
		return;
	}

	// For normal browsers
	let {invalidFiles, invalidProjectionFiles} = await this.onDEMLoadWorker(widget);
	clear();

	if (invalidFiles.length !== 0)
		this.showDEMError(invalidFiles, invalidProjectionFiles);
};

L.ALS.SynthPolygonBaseLayer.prototype.showDEMError = function (invalidFiles, invalidProjectionFiles = []) {
	let errorMessage = L.ALS.locale.DEMError + " " + invalidFiles.join(", ");

	if (invalidProjectionFiles.length !== 0)
		errorMessage += "\n\n" + L.ALS.locale.DEMErrorProjFiles + " " + invalidProjectionFiles.join(", ");

	window.alert(errorMessage + ".");
}

L.ALS.SynthPolygonBaseLayer.prototype._tryProjectionString = function (string) {
	try {
		proj4(string, "WGS84");
		return true;
	} catch (e) {
		return false;
	}
}

/**
 * Being called upon DEM load
 * @param widget {L.ALS.Widgets.File}
 */
L.ALS.SynthPolygonBaseLayer.prototype.onDEMLoadWorker = async function (widget) {
	let files = widget.getValue(),
		parser = new ESRIGridParser(this),
		fileReader = new FileReader(),
		supportsWorker = (window.Worker && process.browser), // We're using webworkify which relies on browserify-specific stuff which isn't available in dev environment
		invalidFiles = [], invalidProjectionFiles = [];

	for (let file of files) {
		let ext = L.ALS.Helpers.getFileExtension(file.name).toLowerCase();

		let isTiff = (ext === "tif" || ext === "tiff" || ext === "geotif" || ext === "geotiff"),
			isGrid = (ext === "asc" || ext === "grd");

		if (!isTiff && !isGrid) {
			if (ext !== "prj" && ext !== "xml")
				invalidFiles.push(file.name);
			continue;
		}

		// Try to find aux or prj file for current file and get projection string from it
		let baseName = "", projectionString = "";

		for (let symbol of file.name) {
			if (symbol === ".")
				break;
			baseName += symbol;
		}

		for (let file2 of files) {
			let ext2 = L.ALS.Helpers.getFileExtension(file2.name).toLowerCase(),
				isPrj = (ext2 === "prj");

			if ((ext2 !== "xml" && !isPrj) || !file2.name.startsWith(baseName))
				continue;

			// Read file
			let text = await new Promise((resolve => {
				let fileReader2 = new FileReader();
				fileReader2.addEventListener("loadend", (e) => {
					resolve(e.target.result);
				});
				fileReader2.readAsText(file2);
			}));

			// prj contains only projection string
			if (isPrj) {
				projectionString = text;

				if (!this._tryProjectionString(projectionString)) {
					invalidProjectionFiles.push(file2.name);
					projectionString = "";
				}

				break;
			}

			// Parse XML
			let start = "<SRS>", end = "</SRS>",
				startIndex = text.indexOf(start) + start.length,
				endIndex = text.indexOf(end);

			projectionString = text.substring(startIndex, endIndex);

			if (projectionString.length !== 0 && this._tryProjectionString(projectionString))
				break;

			invalidProjectionFiles.push(file2.name);
			projectionString = "";
		}

		if (isTiff) {
			if (!GeoTIFFParser)
				continue;
			try {
				let stats = await GeoTIFFParser(file, projectionString, ESRIGridParser.getInitialData(this, false));
				ESRIGridParser.copyStats(this, stats);
			} catch (e) {
				invalidFiles.push(file.name);
			}
			continue;
		}

		if (!supportsWorker) {
			await new Promise((resolve) => {
				ESRIGridParser.parseFile(file, parser, fileReader, () => resolve())
			}).catch(() => invalidFiles.push(file.name));
			continue;
		}

		let worker = work(ESRIGridParserWorker);
		await new Promise(resolve => {
			worker.addEventListener("message", (e) => {
				ESRIGridParser.copyStats(this, e.data);
				resolve();
				worker.terminate();
			});
			worker.postMessage({
				parserData: ESRIGridParser.getInitialData(this),
				projectionString: projectionString,
				file: file,
			});
		}).catch(() => invalidFiles.push(file.name));
	}

	return {invalidFiles, invalidProjectionFiles};
};