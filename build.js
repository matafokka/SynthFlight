const browserify = require("browserify");
const babelify = require("babelify");
const packager = require("electron-packager");
const fs = require("fs");
const fse = require("fs-extra");
const postcss = require("postcss");
const postcssPresetEnv = require("postcss-preset-env");
const cssnano = require("cssnano");
const postcssCssVariables = require("postcss-css-variables");
const postcssThemes = require("postcss-themes");

let onlyBrowser = false, debug = false;

for (let arg of process.argv) {
	if (arg === "-h" || arg === "--help") {
		console.log("Run build.js with following arguments to tweak build process:\n" +
		"\t-h or --help - Show help and quit.\n" +
		"\t-b or --only-browser - Build only for browser. Warning: ALL previous builds will still be removed!\n" +
		"\t-d or --debug - Nothing will be minified for easier debugging."
		);
		process.exit(-1);
	} else if (arg === "-b" || arg === "--only-browser")
		onlyBrowser = true;
	else if (arg === "-d" || arg === "--debug")
		debug = true;
}

console.log("\nStarting SynthFlight build process...\n" +
	"Type -h or --help to view help on build arguments.\n");

fse.emptyDirSync("dist");

// Create build directory
let dir = "dist/SynthFlight-browser/";
fs.mkdirSync(dir + "css", { recursive: true });

// Autoprefix and minify CSS
let plugins = [

	postcssPresetEnv({
		autoprefixer: { flexbox: "no-2009" }
	}),

	postcssThemes({
		themes: { filePath: "css/dark.css" }
	}),

	postcssCssVariables()
];
if (!debug)
	plugins.push(cssnano());

let cssFilename = "css/base.css";
let css = fs.readFileSync(cssFilename).toString();
postcss(plugins).process(css, {from: undefined}).then((result) => {
	fs.writeFile(dir + cssFilename, result.css, {}, (err) => {
		if (err !== null)
			console.log(err);
	});
});

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

	if (!debug) {
		build = build
			.plugin("common-shakeify")
			.transform("uglifyify", {
				global: true,
				ie8: true,
			});
	}
	build.bundle().pipe(fs.createWriteStream(dir + file + ".js"));
}

// Copy styles and scripts referenced in index.html

let toCopy = ["index.html", "logo.ico",
	"node_modules/line-awesome/dist/line-awesome/css/",
	"node_modules/line-awesome/dist/line-awesome/fonts/",
	"node_modules/leaflet/dist/leaflet.css",
	"node_modules/leaflet/dist/leaflet.js",
	"node_modules/leaflet.coordinates/dist/Leaflet.Coordinates-0.1.5.css",
	"node_modules/leaflet.coordinates/dist/Leaflet.Coordinates-0.1.5.min.js",
	"node_modules/classlist/classList.min.js",
	// TODO: Remove it if layer system won't support IE8
	//"node_modules/ie8/build/ie8.js",
	//"node_modules/object-defineproperty-ie/src/object-defineproperty-ie.js",
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