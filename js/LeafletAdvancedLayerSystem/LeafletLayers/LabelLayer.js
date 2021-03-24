/**
 * Display options for a label
 * @typedef {Object} DisplayOptions
 * @property backgroundColor {string} Background color in format which Canvas can read. Defaults to "white".
 * @property borderColor {string} Border color in format which Canvas can read. Defaults to "#ccc".
 * @property fontColor {string} Font color in format which Canvas can read. Defaults to "black".
 * @property textAlign {"left"|"center"|"right"} Text alignment. Defaults to "left".
 * @property origin {"topLeft"|"topCenter"|"topRight"|"bottomLeft"|"bottomCenter"|"bottomRight"|"leftCenter"|"rightCenter"|"center"} Origin of a label, i.e. which "part" of it will be at given latLng. Defaults to "center".
 * @property maxWidth {integer} Maximum width of a label in number of characters per line. If label will exceed this parameter, it will be wrapped. If it's less than 1, label width will not be limited. Defaults to 0.
 */

/**
 * Object that represents label
 * @typedef {Object & DisplayOptions} LabelProperties
 * @property id {string} ID of a label
 * @property text {string} Text of a label
 * @property latLng {[number, number]} Position of a label in format: [lat, lng]. It doesn't work with Leaflet LatLng objects.
 */

/**
 * A fast label rendering layer. Works well with LOADS (50K-100K) of labels on a mid-class PC. Based on L.ALS.LeafletLayers.Canvas. Also extends L.ALS.Serializable.
 *
 * This is preferable option for rendering labels. Use it instead of `L.ALS.LeafletLayers.WidgetLayer`.
 */
L.ALS.LeafletLayers.LabelLayer = L.ALS.LeafletLayers.CanvasLayer.extend({

	includes: L.ALS.Serializable.prototype,

	/**
	 * Font size in pixels. You can extend this class and modify it, but it's not recommended because it will introduce inconsistency between everything.
	 */
	_fontSize: L.ALS.Helpers.isMobile ? 36 : 12,

	/**
	 * Padding around text in pixels. You can extend this class and modify it, but it's not recommended because it will introduce inconsistency between everything.
	 */
	_padding: 4,

	/**
	 *  Constructs a label layer. Consider changing automaticallyRedraw argument to improve performance.
	 * @param automaticallyRedraw {boolean} If set to true, every method will automatically redraw the canvas. If you're repeatedly changing labels, consider setting it to false and redrawing canvas manually by calling `redraw()` method. Doing so will considerably improve performance.
	 */
	initialize: function (automaticallyRedraw = true) {
		L.ALS.LeafletLayers.CanvasLayer.prototype.initialize.call(this);
		L.ALS.Serializable.prototype.initialize.call(this);
		this.serializationIgnoreList.push("getLabelProperties", "_map", "_canvas", "_frame");

		this._defaultLabelOptions = {
			id: "", text: "", latLng: undefined,
			backgroundColor: "white",
			borderColor: "#ccc",
			fontColor: "black",
			textAlign: "left",
			origin: "center",
			maxWidth: 0,
		}
		this._automaticallyRedraw = automaticallyRedraw;
		this._labels = {};
	},

	/**
	 * Sets whether this layer should automatically redraw it's content when any of it's methods called or not.
	 * @param automaticallyRedraw {boolean} If set to true, this canvas will automatically redraw itself.
	 */
	setAutomaticallyRedraw: function (automaticallyRedraw) {
		this._automaticallyRedraw = automaticallyRedraw;
	},

	/**
	 * @return {boolean} True, if this layer automatically redraws it's content. False otherwise.
	 */
	getAutomaticallyRedraw: function () {
		return this._automaticallyRedraw;
	},

	/**
	 * Adds label to this layer. If label with given ID already exists, won't do anything.
	 *
	 * @param id {string} ID of a label for easy later access. Must be unique for this layer. If you don't need it, set it to an empty string, and it will be autogenerated.
	 * @param latLng {[number, number]} Position of a label in format: [lat, lng]. It doesn't work with Leaflet LatLng objects.
	 * @param text {any} Label text
	 * @param displayOptions {DisplayOptions} Label display options
	 */
	addLabel: function (id, latLng, text, displayOptions = this._defaultLabelOptions) {
		let isEmpty = id === "";
		if (!isEmpty && this._labels.hasOwnProperty(id))
			return;

		let label = L.ALS.Helpers.mergeOptions(this._defaultLabelOptions, displayOptions);
		label.id = (isEmpty) ? L.ALS.Helpers.generateID() : id;
		label.text = text.toString();
		label.latLng = latLng;
		this._labels[label.id] = label;

		if (this._automaticallyRedraw)
			this.redraw();
	},

	/**
	 * Deletes label with given ID
	 * @param id {string} ID of a label to delete
	 */
	deleteLabel: function (id) {
		delete this._labels[id];
		if (this._automaticallyRedraw)
			this.redraw();
	},

	/**
	 * Deletes all labels on this layer.
	 */
	deleteAllLabels: function () {
		this._labels = {};
		if (this._automaticallyRedraw)
			this.redraw();
	},

	/**
	 * Sets position of a label with given ID.
	 * @param id {string} ID of a label to set position of.
	 * @param latLng {[number, number]} Position of a label in format: [lat, lng]. It doesn't work with Leaflet LatLng objects.
	 */
	setLabelLatLng: function (id, latLng) {
		this._labels[id].latLng = latLng;
		if (this._automaticallyRedraw)
			this.redraw();
	},

	/**
	 * Sets text of a label with given ID
	 * @param id {string} ID of a label to set text of.
	 * @param text {any} Text to set
	 */
	setLabelText: function (id, text) {
		this._labels[id].text = text.toString();
		if (this._automaticallyRedraw)
			this.redraw();
	},

	/**
	 * Sets display options of a label with given ID.
	 * @param id {string} ID of a label to set display options of.
	 * @param displayOptions {DisplayOptions} Options to set
	 */
	setLabelDisplayOptions: function (id, displayOptions) {
		this._labels[id] = L.ALS.Helpers.mergeOptions(this._labels[id], displayOptions);
		if (this._automaticallyRedraw)
			this.redraw();
	},

	/**
	 * Gets properties of a label with given ID.
	 * @param id {string} ID of a label to get properties of
	 * @return {LabelProperties} Properties of a label. Returned object is not linked to the actual label.
	 */
	getLabelProperties: function (id) {
		return L.ALS.Helpers.mergeOptions(this._labels[id], {});
	},

	draw: function (data) {
		let ctx = data.canvas.getContext("2d");
		ctx.clearRect(0, 0, data.canvas.width, data.canvas.height);

		// Text parameters
		ctx.font = `${this._fontSize}px sans-serif`;
		ctx.textBaseline = "top";

		for (let labelId in this._labels) {
			let label = this._labels[labelId];
			if (!this._labels.hasOwnProperty(labelId))
				continue;

			ctx.textAlign = label.textAlign;

			// Split text into lines
			let lines = [], line = "", pos = 1, shouldWrap = label.maxWidth >= 1, textWidth = 0;
			for (let i = 0; i < label.text.length; i++) {
				let symbol = label.text[i], isLineBreak = symbol === "\n";
				if (!isLineBreak)
					line += symbol;

				if (isLineBreak || i + 1 === label.text.length || (shouldWrap && pos === label.maxWidth)) {
					lines.push(line);
					let width = ctx.measureText(line).width;
					if (width > textWidth)
						textWidth = width;
					line = "";
					pos = 1;
				}
			}

			let origCoords = this.latLngToCanvasCoords(label.latLng); // Coordinates of a label position on the canvas
			let rectHeight = this._fontSize * lines.length;
			let coords = {
				x: origCoords.x,
				y: origCoords.y
			};

			// Determine if we need to draw background or borders. It will be used for both optimisation and padding accounting
			let isBgNone = false, areBordersNone = false;
			for (let param of ["none", "transparent"]) {
				if (label.backgroundColor === param)
					isBgNone = true;
				if (label.borderColor === param)
					areBordersNone = true;
			}
			let shouldDrawBackground = !(isBgNone && areBordersNone);

			// Calculated coordinates will top left corner of the label to the given position.
			// We need to recalculate it for different origins.
			let padding = (shouldDrawBackground) ? this._padding : 0, doublePadding = padding * 2; // This will be applied to rect. Need to adjust coordinates to it.
			let isCenter = label.origin === "center";

			// X
			if (label.origin === "topLeft" || label.origin === "leftCenter" || label.origin === "bottomLeft")
				coords.x += padding;
			else if (label.origin === "topCenter" || isCenter || label.origin === "bottomCenter") {
				coords.x -= textWidth / 2;
			}
			else if (label.origin === "topRight" || label.origin === "rightCenter" || label.origin === "bottomRight")
				coords.x -= textWidth + padding;

			// Y
			if (label.origin === "topLeft" || label.origin === "topCenter" || label.origin === "topRight")
				coords.y += padding;
			if (label.origin === "leftCenter" || isCenter || label.origin === "rightCenter")
				coords.y -= rectHeight / 2;
			else if (label.origin === "bottomLeft" || label.origin === "bottomCenter" || label.origin === "bottomRight")
				coords.y -= rectHeight + padding;

			// Calculate coords to draw the background. We'll use it for both background and checking.
			let x = coords.x - padding, y = coords.y - padding,
				width = textWidth + doublePadding, height = rectHeight + doublePadding;

			// Check if any of the coordinates is in viewport
			let coordsArr = [[x, y],
				[x + width, y],
				[x + width, y + height],
				[x, y + height],
			];

			let shouldContinue = true;
			for (let coord of coordsArr) {
				if (data.bounds.contains(this.canvasCoordsToLatLng(coord))) {
					shouldContinue = false;
					break;
				}
			}

			if (shouldContinue)
				continue;

			// Draw rectangle around text
			if (shouldDrawBackground) {
				ctx.fillStyle = label.backgroundColor;
				ctx.strokeStyle = label.borderColor;
				ctx.fillRect(x, y, width, height);
				ctx.strokeRect(x, y, width, height);
			}

			// Draw text
			ctx.fillStyle = label.fontColor;
			x = coords.x; y = coords.y;
			if (label.textAlign === "center")
				x += textWidth / 2;
			else if (label.textAlign === "right") // right
				x += textWidth;

			for (let line of lines) {
				ctx.fillText(line, x, y);
				y += this._fontSize;
			}
		}
	},

	statics: {

		deserialize: function (serialized, seenObjects) {
			return L.ALS.Serializable.deserialize(serialized, seenObjects);
		},

		/**
		 * Display options to match ALS style
		 */
		DefaultDisplayOptions: {

			/**
			 * Normal label, looks like WidgetLayer
			 */
			Normal: {
				backgroundColor: "white",
				borderColor: "#ccc",
				fontColor: "black",
			},

			/**
			 * Represents error message
			 */
			Error: {
				backgroundColor: "#ffbebe",
				borderColor: "darkred",
				fontColor: "black",
			},

			/**
			 * Represents warning message
			 */
			Warning: {
				backgroundColor: "#fff4c3",
				borderColor: "goldenrod",
				fontColor: "black",
			},

			/**
			 * Represents success message
			 */
			Success: {
				backgroundColor: "#e3ffd3",
				borderColor: "green",
				fontColor: "black",
			},

			/**
			 * Represents informative message
			 */
			Message: {
				backgroundColor: "#e4f7ff",
				borderColor: "cornflowerblue",
				fontColor: "black",
			}
		}
	}

});

L.LabelLayer = L.ALS.LeafletLayers.LabelLayer;