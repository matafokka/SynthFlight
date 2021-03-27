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

.adv-lyr-sys-about-container .pre {
	white-space: pre-wrap;
	font-family: Consolas, consolas, monospace;
}

.adv-lyr-sys-about-container h1 {
	font-size: 2rem;
	word-wrap: break-word;
}

.adv-lyr-sys-about-container img {
	display: inline-block;
	vertical-align: middle;
	margin-right: 1rem;
	width: 3rem;
	height: 3rem;
}

</style>

<h1><img src="logo.ico" alt="Logo" />SynthFlight Pre-Alpha</h1>

<p>SynthFlight is a fully client-side software for planning aerial photography. This is a pre-alpha version, so expect bugs, crashes, errors, missing functions, API changes, etc.</p>

<p>Visit project's <a href="https://github.com/matafokka/SynthFlight">GitHub page</a> for more information.</p>

<p>Developing SynthFlight is possible thanks to open-source software. Check <span class="pre">package.json</span> file for complete list of used software.</p>

<footer><a href="https://github.com/matafokka">© matafokka, ${(new Date()).getFullYear()}</a></footer>
`;