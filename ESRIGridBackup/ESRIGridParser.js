module.exports = function (filename) {
	let fileReader = new FileReader();
	fileReader.readAsText(filename[0]);
	fileReader.addEventListener("load", (event) => { parseString(event.target.result); });
}

function parseString(string) {
	let params = {};
	let readingParamName = true, allParamsRead = false;

	let param = "", value = "";
	for (let symbol of string) {
		// Read parameters
		if (!allParamsRead) {
			// Read param name until we hit space
			if (readingParamName) {
				if (symbol === " ") {
					readingParamName = false;
				}
				else
					param += symbol;
			}
			// Read param value
			else {
				// There might be multiple spaces before the value
				if (symbol === " ")
					continue;

				// If we hit line break, the value has been read
				if (symbol === "\n" || symbol === "\r") {
					params[param] = parseFloat(value);
					param = "";
					value = "";
					readingParamName = true;
				} else
					value += symbol;
			}
			continue;
		}
	}
}