/**
 * Contains System's markup: menu and wizard window
 */
module.exports = function () {
	let parsedDom = document.implementation.createHTMLDocument("title");
	parsedDom.body.innerHTML += `

<div id="menu">
	<!-- Top panel -->
	<div id="top-panel-wrapper">
		<div id="top-panel" class="controls-row-set">
			<i id="menu-close" class="button-base fas fa-times"></i>
			<select id="menu-maps-select"></select>
			<i id="menu-add" class="fas fa-plus"></i>
			<i id="menu-delete" class="fas fa-trash"></i>
		</div>
	</div>
	
	<!-- Content container -->
	<div id="menu-items"></div>
	
	<!-- Bottom panel -->
	<div id="bottom-panel-wrapper">
		<div id="adv-lyr-sys-menu-bottom-panel" class="controls-row-set">
			<div id="adv-lyr-sys-save-button" class="button-base">Save</div>
			<div id="adv-lyr-sys-load-button" class="button-base">Load</div>
			<div id="adv-lyr-sys-export-button" class="button-base">Export</div>
			<div id="adv-lyr-sys-settings-button" class="button-base">Settings</div>
		</div>
	</div>
</div>

<!-- Wizard that lets users add new layers -->
<div id="wizard-container" data-hidden="1">
	<div id="wizard-window">
		<select id="wizard-menu"></select>
		<div id="wizard-content"></div>
		<div id="wizard-buttons" class="controls-row-set">
			<div class="button-base" id="wizard-cancel-button">Cancel</div>
			<div class="button-base" id="wizard-add-button">Add</div>
		</div>
	</div>
</div>
`
	while (parsedDom.body.hasChildNodes()) {
		document.body.appendChild(parsedDom.body.firstChild.cloneNode(true));
		parsedDom.body.removeChild(parsedDom.body.firstChild);
	}
}