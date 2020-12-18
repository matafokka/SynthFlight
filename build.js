const browserify = require("browserify");
const babelify = require("babelify");
const tinyify = require("tinyify");
const packager = require("electron-packager");
const fs = require("fs");
const fse = require("fs-extra");
const postcss = require("postcss");
const postcssPresetEnv = require("postcss-preset-env");
const cssnano = require("cssnano");

let onlyBrowser = false;

for (let arg of process.argv) {
	if (arg === "-h" || arg === "--help") {
		console.log("Run build.js with following arguments to tweak build process:\n" +
		"\t-h or --help - Show help and quit.\n" +
		"\t-b or --only-browser - Build only for browser. Warning: this script still will remove ALL previous builds!\n"
		);
		process.exit(-1);
	} else if (arg === "-b" || arg === "--only-browser")
		onlyBrowser = true;
}

console.log("\nStarting SynthFlight build process...\n" +
	"Type -h or --help to view help on build arguments.\n");

fse.emptyDirSync("dist");

// Create build directory
let dir = "dist/SynthFlight-browser/";
fs.mkdirSync(dir + "css", { recursive: true });

// Autoprefix and minify CSS
let cssFiles = fs.readdirSync("css");
for (let cssFile of cssFiles) {
	let fileName = "css/" + cssFile;
	let css = fs.readFileSync(fileName).toString();
	postcss([
		postcssPresetEnv(),
		cssnano()
	]).process(css, {from: undefined}).then((result) => {
		fs.writeFile(dir + fileName, result.css, {}, (err) => {
			if (err !== null)
				console.log(err);
		});
	});
}

// Build project
let files = ["polyfills", "main"]; // Files to build
for (let file of files) {
	let build = browserify([file + ".js"]);
	if (file !== "polyfills") { // Transform everything except polyfills from CoreJS
		build = build.transform("babelify", {
			presets: ["@babel/preset-env"],
			global: true, // ShpJS is built without polyfills and uses async functions. So we have to build node_modules too. Maybe other modules are built that way too.
		});
	}

	build
		.transform('uglifyify', { global: true })
		.plugin('common-shakeify')
		.bundle()
		.pipe(require('minify-stream')({ sourceMap: false }))
		.pipe(fs.createWriteStream(dir + file + ".js"));
}

// Copy styles and scripts referenced in index.html

let toCopy = ["index.html", "logo.ico",
	"node_modules/@fortawesome/fontawesome-free/css",
	"node_modules/@fortawesome/fontawesome-free/webfonts",
	"node_modules/leaflet/dist/leaflet.css",
	"node_modules/leaflet/dist/leaflet.js",
	"node_modules/leaflet.coordinates/dist/Leaflet.Coordinates-0.1.5.css",
	"node_modules/leaflet.coordinates/dist/Leaflet.Coordinates-0.1.5.min.js"
];

for (let stuff of toCopy)
	fse.copy(stuff, dir + stuff);

// Build electron app
if (!onlyBrowser) {
	let ignore = ["build.js", ".idea", ".cache", "dist", "ESRIGridBackup"];
	packager({
		all: true,
		dir: ".",
		out: "dist",
		ignore: (path) => {
			for (let p of ignore)
				if (path === "/" + p)
					return true;
			return false;
		},
		icon: "logo.ico",
	});
}