/**
 * Wizard window
 *
 * @param button {Element} Button which will activate this window
 *
 * @class
 * @extends L.ALS._service.SidebarWindow
 * @ignore
 */
L.ALS._service.WizardWindow = L.ALS._service.SidebarWindow.extend( /** @lends L.ALS._service.WizardWindow.prototype */ {

	initialize: function (button) {
		L.ALS._service.SidebarWindow.prototype.initialize.call(this, button, "wizardSelectTitle", "wizardContentTitle");
		this.select.classList.add("als-wizard-menu");

		let addButton = document.createElement("div");
		addButton.className = "als-button-base als-wizard-add-button";
		addButton.setAttribute("data-mobile-class", "ri ri-check-line");
		L.ALS.Locales.localizeElement(addButton, "wizardAddButton");
		this.window.querySelector("div[data-id='buttons-wrapper']").appendChild(addButton);
		addButton.addEventListener("click", () => {
			this.windowContainer.setAttribute("data-hidden", "1");
		});

		L.ALS.Helpers._applyButtonsIconsIfMobile(this.buttonsWrapper);
	}
});