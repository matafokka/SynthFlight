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

.als-about-container ul {
	font-family: Consolas, consolas, monospace;
	max-height: 5rem;
	overflow: auto;
	border: 1px solid #ccc;
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

<h1><img src="logo.ico" alt="Logo" />SynthFlight Alpha</h1>

<p data-als-locale-property="firstParagraph"></p>

<p><span data-als-locale-property="secondParagraphPart1"></span> <a href="https://github.com/matafokka/SynthFlight" data-als-locale-property="secondParagraphPart2"></a> <span data-als-locale-property="secondParagraphPart3"></span></p>

<p data-als-locale-property="thirdParagraph"></p>

<p data-als-locale-property="fourthParagraph"></p>
<ul>
	<li>OpenStreetMaps</li>
	<li>Google Maps</li>
	<li>Yandex Maps</li>
</ul>

<footer><a href="https://github.com/matafokka">© matafokka, ${(new Date()).getFullYear()}</a></footer>
`;