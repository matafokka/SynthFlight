L.ALS._service.WizardWindow = L.ALS._service.SidebarWindow.extend({
	initialize: function (button) {
		L.ALS._service.SidebarWindow.prototype.initialize.call(this, button, "Select layer type to add", "Set initial layer parameters");
		this.container.id = "wizard-content";
		this.select.id = "wizard-menu"

		let addButton = document.createElement("div");
		addButton.className = "button-base";
		addButton.id = "wizard-add-button";
		addButton.textContent = "Add";
		this.window.querySelector("div[data-id='buttons-wrapper']").appendChild(addButton);
		addButton.addEventListener("click", () => {
			this.windowContainer.setAttribute("data-hidden", "1");
		});
	}
});