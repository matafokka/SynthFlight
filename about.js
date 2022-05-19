const {version} = require("./package.json");

module.exports = `
<style>
.als-about-container p {
	text-align: justify;
}

.als-about-container a {
	color: cornflowerblue;
	transition: color 0.2s, text-shadow 0.2s;
}

.als-about-container a:hover {
	color: purple;
	text-shadow: pink 0 0 5px;
	transition: color 0.2s, text-shadow 0.2s;
}

.als-dark .als-about-container a:hover {
	color: pink;
}

.als-about-container h1 {
	font-size: 2rem;
	margin: 0;
	word-wrap: break-word;
}

.als-about-container img {
	display: inline-block;
	vertical-align: middle;
	margin-right: 1rem;
	width: 2.5rem;
	height: 2.5rem;
}

.als-about-container footer {
	width: 100%;
	padding-top: 0.2rem;
	box-sizing: border-box;
	text-align: center;
	border-top: 1px solid #ccc;
}
</style>

<h1><img src="img/logo.ico" alt="Logo" />SynthFlight ${version}</h1>

<p data-als-locale-property="about1"></p>

<p><span data-als-locale-property="about2Part1"></span> <a href="https://github.com/matafokka/SynthFlight" target="_blank" data-als-locale-property="about2Part2"></a> <span data-als-locale-property="about2Part3"></span></p>

<p><span data-als-locale-property="about3Part1"></span> <a href="https://github.com/matafokka/SynthFlight/wiki" target="_blank" data-als-locale-property="about3Part2"></a></p>

<p data-als-locale-property="about4"></p>

<p data-als-locale-property="about5"></p>
<ul>
	<li><a href="https://basemaps.cartocdn.com" target="_blank">CartoDB</a></li>
	<li><a href="https://www.openstreetmap.org" target="_blank">OpenStreetMap</a></li>
	<li><a href="https://www.maps.google.com" target="_blank">Google Maps</a></li>
	<li><a href="https://www.yandex.ru/maps" target="_blank">Yandex Maps</a></li>
</ul>

<p><span data-als-locale-property="about6"></span> <a href="https://nominatim.org/" target="_blank">Nominatim API</a></p>

<footer><a href="https://github.com/matafokka">© matafokka, ${(new Date()).getFullYear()}</a></footer>
`;