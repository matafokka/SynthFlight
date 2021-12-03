// Methods related to DEM loading

const ESRIGridParser = require("../ESRIGridParser.js");
const ESRIGridParserWorker = require("../ESRIGridParserWorker.js");
let GeoTIFFParser;
try {
	GeoTIFFParser = require("../GeoTIFFParser.js");
} catch (e) {}
const work = require("webworkify");

L.ALS.SynthPolygonLayer.prototype.onDEMLoad = async function (widget) {
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
			parser.readChunk(grid);
			parser.copyStats();
			clear();
		});
		return;
	}

	// For normal browsers
	try {
		await this.onDEMLoadWorker(widget);
	} catch (e) {
		console.error(e);
		window.alert(L.ALS.locale.DEMError);
	}
	clear();

};

/**
 * Being called upon DEM load
 * @param widget {L.ALS.Widgets.File}
 */
L.ALS.SynthPolygonLayer.prototype.onDEMLoadWorker = async function (widget) {
	let files = widget.getValue();
	let parser = new ESRIGridParser(this);
	let fileReader = new FileReader();
	// noinspection JSUnresolvedVariable
	let supportsWorker = (window.Worker && process.browser); // We're using webworkify which relies on browserify-specific stuff which isn't available in dev environment

	for (let file of files) {
		let ext = L.ALS.Helpers.getFileExtension(file.name).toLowerCase();

		let isTiff = (ext === "tif" || ext === "tiff" || ext === "geotif" || ext === "geotiff");
		let isGrid = (ext === "asc" || ext === "grd");

		if (!isTiff && !isGrid)
			continue;

		// Try to find aux or prj file for current file and get projection string from it
		let baseName = this.getFileBaseName(file.name), projectionString = "";
		for (let file2 of files) {
			let ext2 = L.ALS.Helpers.getFileExtension(file2.name).toLowerCase();
			let isPrj = (ext2 === "prj");
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
				break;
			}

			// Parse XML
			let start = "<SRS>", end = "</SRS>";
			let startIndex = text.indexOf(start) + start.length;
			let endIndex = text.indexOf(end);
			if (startIndex === start.length - 1 || endIndex === -1)
				continue; // Continue in hope of finding not broken xml or prj file.
			projectionString = text.substring(startIndex, endIndex);
			break;
		}

		if (isTiff) {
			if (!GeoTIFFParser)
				continue;
			let stats = await GeoTIFFParser(file, projectionString, ESRIGridParser.getInitialData(this));
			ESRIGridParser.copyStats(this, stats);
			continue;
		}

		if (!supportsWorker) {
			await new Promise((resolve) => {
				ESRIGridParser.parseFile(file, parser, fileReader, () => {
					resolve();
				})
			});
			continue;
		}

		//let workerFn = isTiff ? GeoTIFFParserWorker : ESRIGridParserWorker; // In case we'll define another parser
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
		});
	}

};

L.ALS.SynthPolygonLayer.prototype.getFileBaseName = function (filename) {
	let baseName = "";
	for (let symbol of filename) {
		if (symbol === ".")
			return baseName;
		baseName += symbol;
	}
	return baseName;
};