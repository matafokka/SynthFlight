L.ALS.Helpers.HTMLToElement(`
<input type="file" id="als-load-input" />
<input type="file" id="als-load-settings-input" />
<div id="menu">
	<!-- Top panel -->
	<div id="top-panel-wrapper">
		<div id="top-panel" class="controls-row-set">
		
			<i id="menu-close" class="button-base las la-times" data-als-locale-property="menuCloseButton" data-als-locale-property-to-localize="title"></i>
			
			<div id="als-save-button" class="button-base las la-save" data-als-locale-property="menuSaveButton" data-als-locale-property-to-localize="title"></div>
			
			<label for="als-load-input" id="als-load-button" class="button-base las la-folder-open" data-als-locale-property="menuLoadButton" data-als-locale-property-to-localize="title"></label>
			
			<div id="als-export-button" class="button-base las la-share-alt" data-als-locale-property="menuExportButton" data-als-locale-property-to-localize="title"></div>
			
			<div id="als-settings-button" class="button-base las la-sliders-h" data-als-locale-property="menuSettingsButton" data-als-locale-property-to-localize="title"></div>
			
			<select id="menu-maps-select"></select>
			
			<i id="menu-add" class="las la-plus" data-als-locale-property="menuAddButton" data-als-locale-property-to-localize="title"></i>
			
			<i id="menu-delete" class="las la-trash" data-als-locale-property="menuDeleteButton" data-als-locale-property-to-localize="title"></i>
		</div>
	</div>
	<!-- Content container -->
	<div id="menu-items"></div>
</div>
`);