module.exports = `
<style>
.adv-lyr-sys-about-container p {
	text-align: justify;
}

.adv-lyr-sys-about-container a {
	color: cornflowerblue;
	transition: color 0.2s, text-shadow 0.2s;
}

.adv-lyr-sys-about-container a:hover {
	color: purple;
	text-shadow: pink 0 0 5px;
	transition: color 0.2s, text-shadow 0.2s;
}

.adv-lyr-sys-about-container ul {
	font-family: Consolas, consolas, monospace;
	max-height: 5rem;
	overflow: auto;
	border: 1px solid #ccc;
}

.adv-lyr-sys-about-container h1 {
	font-size: 2rem;
	margin: 0;
	word-wrap: break-word;
}

.adv-lyr-sys-about-container img {
	display: inline-block;
	vertical-align: middle;
	margin-right: 1rem;
	width: 2.5rem;
	height: 2.5rem;
}

.adv-lyr-sys-about-container footer {
	width: 100%;
	padding-top: 0.2rem;
	box-sizing: border-box;
	text-align: center;
	border-top: 1px solid #ccc;
}

</style>

<h1><img src="logo.ico" alt="Logo" />SynthFlight Pre-Alpha</h1>

<p>SynthFlight is a fully client-side software for planning aerial photography. This is a pre-alpha version, so expect bugs, crashes, errors, missing functions, API changes, etc.</p>

<p>Visit project's <a href="https://github.com/matafokka/SynthFlight">GitHub page</a> for more information.</p>

<p>Developing SynthFlight is possible thanks to following open-source software:</p>

<ul>
	<li>Babel</li>
	<li>Babelify</li>
	<li>Browserify</li>
	<li>chalk</li>
	<li>classlist</li>
	<li>common-shakeify</li>
	<li>core-js</li>
	<li>cssnano</li>
	<li>debounce</li>
	<li>Electron</li>
	<li>electron-packager</li>
	<li>FileSaver.js</li>
	<li>fs-extra</li>
	<li>gLayers.Leaflet</li>
	<li>jscolor</li>
	<li>jsdom</li>
	<li>jsdom-global</li>
	<li>JSZip</li>
	<li>keyboardevent-key-polyfill</li>
	<li>Leaflet</li>
	<li>Leaflet.Coordinates</li>
	<li>object-defineproperty-ie</li>
	<li>PostCSS</li>
	<li>postcss-preset-env</li>
	<li>roman-numerals</li>
	<li>shpjs</li>
	<li>SortableJS</li>
	<li>time-input-polyfill</li>
	<li>uglifyify</li>
</ul>

Using cool maps is possible thanks to following providers:
<ul>
	<li>OpenStreetMaps</li>
	<li>Google Maps</li>
	<li>Yandex Maps</li>
</ul>

<footer><a href="https://github.com/matafokka">© matafokka, ${(new Date()).getFullYear()}</a></footer>
`;