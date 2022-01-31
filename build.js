const persistify = require("persistify");
const babelify = require("babelify");
const packager = require("electron-packager");
const fs = require("fs");
const fse = require("fs-extra");
const {Worker} = require('worker_threads');

let onlyBrowser = false, debug = false, cssThreadFinished = false, copyPromiseFinished = false,
	dir = "dist/SynthFlight-browser/",
	electronDeps = ["package.json", "electronApp.js"], // Packager can't work without these in dist
	electronMissingDeps = ["node_modules/@electron", "node_modules/leaflet-advanced-layer-system/ElectronIntegration.js", "node_modules/leaflet-advanced-layer-system/_service/mergeOptions.js"]; // Packager also won't copy these for some unknown reason

let buildElectron = () => {
	if (onlyBrowser || !(cssThreadFinished && copyPromiseFinished))
		return;

	let ignore = ["build.js", ".idea", ".cache", "dist"];
	packager({
		all: true,
		asar: true,
		dir: dir,
		out: "dist",
		prune: false,
		afterCopy: [(buildPath, electronVersion, platform, arch, callback) => {
			for (let source of electronMissingDeps)
				fse.copySync(source, buildPath + "/" + source);
			callback();
		}],
		ignore: (path) => {
			for (let p of ignore) {
				if (path === "/" + p)
					return true;
			}
			return false;
		},
		icon: "img/logo.ico",
	}).then(() => {
		for (let file of electronDeps)
			fs.unlink(dir + file, () => {});
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
}).require("./node_modules/geotiff/src/geotiff.js", {expose: "geotiff"}) // Thanks to parcel for this nightmare
	.transform("babelify", {
		presets: ["@babel/preset-env"],
		global: true, // ShpJS is built without polyfills and uses async functions. So we have to build node_modules too. Maybe other modules are built that way too.
		minified: !debug,
	}).plugin("common-shakeify")
	.transform("uglifyify", {
		global: true,
		ie8: true,
		sourceMap: debug
	})
	.bundle().pipe(fs.createWriteStream(dir + mainFile));

// Copy styles and scripts referenced in index.html

let toCopy = ["index.html", "img/logo.ico", "img/logo.svg", "img/logo.png", "img/logo-apple.png", "manifest.json",
	"node_modules/leaflet-advanced-layer-system/dist/css",
	"node_modules/leaflet-advanced-layer-system/dist/polyfills.js",
	"node_modules/leaflet/dist/leaflet.css",
	"node_modules/leaflet/dist/leaflet.js",
	"node_modules/leaflet/dist/images",
	"node_modules/leaflet.coordinates/dist/Leaflet.Coordinates-0.1.5.css",
	"node_modules/leaflet.coordinates/dist/Leaflet.Coordinates-0.1.5.min.js",
	"node_modules/leaflet-draw/dist/leaflet.draw.css",
	"node_modules/leaflet-draw/dist/images",
];

if (!onlyBrowser)
	toCopy.push(...electronDeps) // Needed for Electron, will be removed after packaging

// Copy files and insert file list to the service worker
let promises = [], swContent = fs.readFileSync("PWAServiceWorker.js").toString(),
	insertAt = swContent.indexOf("/** to_cache_list */"),
	buildFileTree = (path) => {
		if (!fs.lstatSync(path).isDirectory()) {
			swContent = swContent.slice(0, insertAt) + `"${path}",` + swContent.slice(insertAt);
			return;
		}

		let content = fs.readdirSync(path);
		for (let file of content)
			buildFileTree(path + "/" + file);
	}

for (let target of toCopy) {
	promises.push(new Promise((resolve) => {
		fse.copy(target, dir + target).then(resolve());
	}));
	buildFileTree(target);
}

Promise.all(promises).then(() => {
	fs.writeFileSync(dir + "PWAServiceWorker.js", swContent);
	copyPromiseFinished = true;
	buildElectron();
}).catch(error => {
	console.error(error.message);
});