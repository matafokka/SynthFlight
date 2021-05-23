const postcss = require("postcss");
const postcssPresetEnv = require("postcss-preset-env");
const cssnano = require("cssnano");
const {workerData} = require("worker_threads");
const fs = require("fs");

// Build CSS
let plugins = [
	postcssPresetEnv({
		autoprefixer: {flexbox: "no-2009"}
	}),
];
if (!workerData.debug)
	plugins.push(cssnano());

let cssFilename = "css/styles.css";
let css = fs.readFileSync(cssFilename).toString();

postcss(plugins).process(css, {from: undefined}).then(async (result) => {
	fs.writeFile(workerData.dir + cssFilename, result.css, {}, (err) => {
		if (err)
			console.log(err);
	});
});