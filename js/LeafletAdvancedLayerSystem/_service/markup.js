L.ALS.Helpers.HTMLToElement(`
<input type="file" id="adv-lyr-sys-load-input" />
<input type="file" id="adv-lyr-sys-load-settings-input" />
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
			<label for="adv-lyr-sys-load-input" id="adv-lyr-sys-load-button" class="button-base">Load</label>
			<div id="adv-lyr-sys-export-button" class="button-base">Export</div>
			<div id="adv-lyr-sys-settings-button" class="button-base">Settings</div>
		</div>
	</div>
</div>
`);