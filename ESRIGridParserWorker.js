const ESRIGridParser = require("./ESRIGridParser.js");

/**
 * A WebWorker wrapper around {@link ESRIGridParser.parseFile}.
 * @param worker {Worker}
 */
module.exports = function (worker) {
	worker.addEventListener("message", (e) => {
		let parser = new ESRIGridParser();
		parser.polygonsCoordinates = e.data.parserData;
		ESRIGridParser.parseFile(e.data.file, parser, new FileReader(), (polygonsStats) => {
			worker.postMessage(polygonsStats);
		});
	});
}