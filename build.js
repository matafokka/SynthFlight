const persistify = require("persistify");
const babelify = require("babelify");
const packager = require("electron-packager");
const fs = require("fs");
const fse = require("fs-extra");
const {Worker} = require('worker_threads');

let onlyBrowser = false, debug = false, cssThreadFinished = false, copyPromiseFinished = false;
let dir = "dist/SynthFlight-browser/";

let buildElectron = () => {
	if (onlyBrowser || !(cssThreadFinished && copyPromiseFinished))
		return;

	let ignore = ["build.js", ".idea", ".cache", "dist", "docs", "ESRIGridBackup"];

	packager({
		all: true,
		dir: dir,
		out: "dist",
		ignore: (path) => {
			for (let p of ignore)
				if (path === "/" + p)
					return true;
			return false;
		},
		icon: "logo.ico",
	}).then(() => {
		for (let file of ["package.json", "electronApp.js"])
			fs.unlink(dir + file, () => {
			});
	});

}

for (let arg of process.argv) {
	if (arg === "-h" || arg === "--help") {
		console.log("Run build.js with following arguments to tweak build process:\n" +
			"\t-h or --help - Show help and quit.\n" +
			"\t-b or --only-browser - Build only for browser.\n" +
			"\t-d or --debug - Source maps will be generated."
		);
		process.exit(-1);
	} else if (arg === "-b" || arg === "--only-browser")
		onlyBrowser = true;
	else if (arg === "-d" || arg === "--debug")
		debug = true;
}

console.log(`\n${new Date().toTimeString()} - Starting SynthFlight build process...\n` +
	"Type -h or --help to view help on build arguments.\n");

fse.emptyDirSync("dist");

// Create build directory
fs.mkdirSync(dir + "css", {recursive: true});

// Create worker
let worker = new Worker("./buildCSSWorker.js", {
	workerData: {
		debug: debug, dir: dir,
	}
});

worker.on("exit", () => {
	cssThreadFinished = true;
	buildElectron();
});

// Build project
let mainFile = "main.js";
persistify({
	entries: [mainFile],
	debug: debug
}).transform("babelify", {
	presets: ["@babel/preset-env"],
	global: true, // ShpJS is built without polyfills and uses async functions. So we have to build node_modules too. Maybe other modules are built that way too.
	minified: !debug,
	//ignore: [/node_modules\/geotiff/],
}).plugin("common-shakeify")
	.transform("uglifyify", {
		global: true,
		ie8: true,
		sourceMap: debug
	})
	.bundle().pipe(fs.createWriteStream(dir + mainFile));

// Copy styles and scripts referenced in index.html

let toCopy = ["index.html", "logo.ico",
	"node_modules/leaflet-advanced-layer-system/dist/css",
	"node_modules/leaflet-advanced-layer-system/dist/polyfills.js",
	"node_modules/leaflet/dist/leaflet.css",
	"node_modules/leaflet/dist/leaflet.js",
	"node_modules/leaflet.coordinates/dist/Leaflet.Coordinates-0.1.5.css",
	"node_modules/leaflet.coordinates/dist/Leaflet.Coordinates-0.1.5.min.js",
];

if (!onlyBrowser)
	toCopy.push("package.json", "electronApp.js") // Needed for Electron, will be removed after packaging

let promises = [];
for (let target of toCopy)
	promises.push(new Promise((resolve) => {
		fse.copy(target, dir + target).then(resolve());
	}));

Promise.all(promises).then(() => {
	copyPromiseFinished = true;
	buildElectron();
}).catch(error => {
	console.error(error.message)
});