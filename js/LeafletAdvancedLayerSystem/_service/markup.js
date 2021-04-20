module.exports = `
<input type="file" id="als-load-input" />
<input type="file" id="als-load-settings-input" />
<div class="als-menu">
	<!-- Top panel -->
	<div class="als-top-panel-wrapper">
		<div class="als-items-row als-top-panel">
		
			<i class="als-button-base ri ri-close-line als-menu-close" data-als-locale-property="menuCloseButton" data-als-locale-property-to-localize="title"></i>
			
			<div class="als-button-base ri ri-save-3-line als-save-button" data-als-locale-property="menuSaveButton" data-als-locale-property-to-localize="title"></div>
			
			<label for="als-load-input" class="als-button-base ri ri-folder-open-line als-load-button" data-als-locale-property="menuLoadButton" data-als-locale-property-to-localize="title"></label>
			
			<div class="als-button-base ri ri-share-line als-export-button" data-als-locale-property="menuExportButton" data-als-locale-property-to-localize="title"></div>
			
			<div class="als-button-base ri ri-sound-module-line als-settings-button" data-als-locale-property="menuSettingsButton" data-als-locale-property-to-localize="title"></div>
			
			<select class="als-menu-maps-select"></select>
			
			<i class="ri ri-add-line als-menu-add" data-als-locale-property="menuAddButton" data-als-locale-property-to-localize="title"></i>
			
			<i class="ri ri-delete-bin-line als-menu-delete" data-als-locale-property="menuDeleteButton" data-als-locale-property-to-localize="title"></i>
		</div>
	</div>
	<!-- Content container -->
	<div class="als-menu-items"></div>
</div>
`