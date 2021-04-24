module.exports = `
<style>
.als-about-container p {
	text-align: justify;
}

.als-about-container p.extended {
	padding-left: 1rem;
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

.als-about-container h1 {
	font-size: 2rem;
	margin: 0;
	word-wrap: break-word;
}

.als-about-container .pre, .als-about-container pre {
	font-family: Consolas, consolas, monospace;
	max-width: 100%;
	white-space: pre-wrap;
	overflow-wrap: break-word;
	color: darkblue;
}

.als-about-container footer {
	width: 100%;
	padding-top: 0.2rem;
	box-sizing: border-box;
	text-align: center;
	border-top: 1px solid #ccc;
}

</style>

<h1>Advanced Layer System for Leaflet</h1>

<p>Welcome to Advanced Layer System and thank you for using it!</p>

<p>You probably want to change this text. To do so:</p>

<p class="extended">1. Create .js file (let's call it <span class="pre">about.js</span>) looking like this:</p>

<pre>
module.exports = \`

&lt;div&gt;
	&lt;div&gt;My HTML markup...&lt;/div&gt;
	&lt;div data-als-locale-property="textLocalizedByLocaleProperty"&gt;\&lt;/div&gt;
&lt;/div&gt;

\`
</pre>

<p>So you're just exporting string with your HTML markup. You can also localize it by setting <span class="pre">data-als-locale-property</span> attribute as shown above.</p>

<p class="extended">2. Require your file and pass it to <span class="pre">L.ALS.System</span> constructor like this:</p>
<pre>
let layerSystem = new L.ALS.System(map, { aboutHTML: require("./about.js") }).addTo(map);
</pre>

<footer><a href="https://github.com/matafokka">© matafokka, ${(new Date()).getFullYear()}</a></footer>
`;