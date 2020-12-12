module.exports = function() {
	let parsedDom = new DOMParser().parseFromString(`

<body>
	<div id="menu">
		<!-- Top panel -->
		<div id="menu-buttons" class="controls-row-set">
			<label for="menu-button-checkbox" id="menu-close" class="button-base icon-button fas fa-times"></label>
			<select id="menu-maps-select"></select>
			<i id="menu-add" class="icon-button fas fa-plus"></i>
			<i id="menu-delete" class="icon-button fas fa-trash"></i>
		</div>
		
		<!-- Content container -->
		<div id="menu-items"></div>
		
		<!-- Bottom panel -->
		<div id="adv-lyr-sys-menu-bottom-panel" class="controls-row-set">
			<input type="button" id="adv-lyr-sys-save-button" value="Save" />
			<input type="button" id="adv-lyr-sys-load-button" value="Load" />
			<input type="button" id="adv-lyr-sys-export-button" value="Export">
			<input type="button" id="adv-lyr-sys-settings-button" value="Settings">
		</div>
	</div>
	
	<!-- Wizard that lets users add new layers -->
	<div id="wizard-container" data-hidden="1">
		<div id="wizard-window">
			<select id="wizard-menu"></select>
			<div id="wizard-content"></div>
			<div id="wizard-buttons" class="controls-row-set">
				<input type="button" id="wizard-cancel-button" value="Cancel" />
				<input type="button" id="wizard-add-button" value="Add">
			</div>
		</div>
	</div>
</body>

`, "text/html");
	while (parsedDom.body.hasChildNodes())
		document.body.appendChild(parsedDom.body.firstChild);
}