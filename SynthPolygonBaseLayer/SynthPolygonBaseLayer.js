let GeoTIFFParser;
try {
	GeoTIFFParser = require("../GeoTIFFParser.js");
} catch (e) {
}

/**
 * Contains common logic for rectangle and polygon layers
 *
 * @class
 * @extends L.ALS.SynthBaseLayer
 */
L.ALS.SynthPolygonBaseLayer = L.ALS.SynthBaseLayer.extend( /** @lends L.ALS.SynthPolygonBaseLayer.prototype */ {
	useZoneNumbers: false,
	calculateCellSizeForPolygons: true,

	/**
	 * Indicates whether the grid is displayed or not.
	 * @type {boolean}
	 */
	isDisplayed: true,

	_doHidePolygonWidgets: false,
	_doHidePathsNumbers: false,

	init: function (
		settings,
		// Path 1 args
		path1InternalConnections,
		path1ExternalConnections,
		path1ActualPathGroup,
		pointsGroup1 = undefined,
		colorLabel1 = "parallelsColor",
		hidePaths1WidgetId = "hidePathsByParallels",
		// Path 2 args
		path2InternalConnections = undefined,
		path2ExternalConnections = undefined,
		path2ActualPathGroup = undefined,
		pointsGroup2 = undefined,
		colorLabel2 = "meridiansColor",
		hidePaths2WidgetId = "hidePathsByMeridians",
	) {
		this.serializationIgnoreList.push("polygons", "invalidPolygons", "lngDistance", "latDistance", "_currentStandardScale");

		this.polygonGroup = new L.FeatureGroup();
		this.widgetsGroup = new L.FeatureGroup();
		this.bordersGroup = new L.FeatureGroup();
		this.bordersGroup.thicknessMultiplier = 4;
		this.labelsGroup = new L.LabelLayer(false);

		L.ALS.SynthBaseLayer.prototype.init.call(this, settings,
			path1InternalConnections, path1ExternalConnections, colorLabel1, [path1ActualPathGroup],
			path2InternalConnections, path2ExternalConnections, colorLabel2, [path2ActualPathGroup]
		);

		this.path1.pointsGroup = pointsGroup1;
		this.path1.hidePathsWidgetId = hidePaths1WidgetId;
		this.path1.actualPathGroup = path1ActualPathGroup;
		this.path1.toUpdateColors.push(pointsGroup1);

		if (this.path2) {
			this.path2.pointsGroup = pointsGroup2;
			this.path2.hidePathsWidgetId = hidePaths2WidgetId;
			this.path2.actualPathGroup = path2ActualPathGroup;
			this.path2.toUpdateColors.push(pointsGroup2);
		}

		this.groupsToHideOnEditStart = [
			path1InternalConnections, path1ExternalConnections, path1ActualPathGroup, pointsGroup1,
			path2InternalConnections, path2ExternalConnections, path2ActualPathGroup, pointsGroup2,
			this.widgetsGroup, this.labelsGroup,
		];

		this.addLayers(this.polygonGroup, this.widgetsGroup, this.bordersGroup, pointsGroup1, path1ActualPathGroup, this.labelsGroup);
		this.toUpdateThickness.push(this.polygonGroup, this.bordersGroup, pointsGroup1, path1ActualPathGroup);

		if (this.path2) {
			this.addLayers(pointsGroup2, path2ActualPathGroup);
			this.toUpdateThickness.push(pointsGroup2, path2ActualPathGroup);
		}

		this.addWidgets(
			new L.ALS.Widgets.Checkbox("hidePolygonWidgets", "hidePolygonWidgets", this, "updateLayersVisibility"),
			new L.ALS.Widgets.Checkbox("hideNumbers", "hideNumbers", this, "updateLayersVisibility"),
			new L.ALS.Widgets.Checkbox("hideCapturePoints", "hideCapturePoints", this, "updateLayersVisibility").setValue(true),
			new L.ALS.Widgets.Checkbox("hidePathsConnections", "hidePathsConnections", this, "updateLayersVisibility"),
			new L.ALS.Widgets.Checkbox(this.path1.hidePathsWidgetId, this.path1.hidePathsWidgetId, this, "updateLayersVisibility"),
		);

		if (this.path2) {
			this.addWidget(
				new L.ALS.Widgets.Checkbox(this.path2.hidePathsWidgetId, this.path2.hidePathsWidgetId, this, "updateLayersVisibility"));
		}

		this.addWidgets(
			new L.ALS.Widgets.Color("borderColor", this.borderColorLabel, this, "setColor").setValue(this.borderColor),
			new L.ALS.Widgets.Color("fillColor", this.fillColorLabel, this, "setColor").setValue(this.fillColor),
		);

		this.addBaseParametersInputSection();

		let DEMFilesLabel = "DEMFiles";
		if (!GeoTIFFParser)
			DEMFilesLabel = "DEMFilesWhenGeoTIFFNotSupported";
		if (L.ALS.Helpers.isIElte9)
			DEMFilesLabel = "DEMFilesIE9";

		this.addWidgets(
			new L.ALS.Widgets.File("DEMFiles", DEMFilesLabel, this, "onDEMLoad").setMultiple(true),
			new L.ALS.Widgets.Divider("div3"),
		);

		this.addBaseParametersOutputSection();
	},

	/**
	 * Calculates grid hiding threshold
	 * @param settings {SettingsObject} Settings to calculate threshold from
	 */
	calculateThreshold: function (settings) {
		let multiplier = (settings.gridHidingFactor - 5) / 5; // Factor is in range [1..10]. Let's make it [-1...1]
		this.minThreshold = 15 + 10 * multiplier;
		this.maxThreshold = 60 + 60 * multiplier;

		// If grid will have labels, on lower zoom levels map will become both messy and unusably slow. So we have to set higher hiding threshold.
		this.hidingThreshold = this._currentStandardScale === Infinity ? this.minThreshold : this.maxThreshold;
	},

	applyNewSettings: function (settings) {
		this.calculateThreshold(settings);
		this.calculateParameters();
	},

	onHide: function () {
		for (let path of this.paths)
			path.pathGroup.remove();
	},

	onShow: function () {
		this.updateLayersVisibility();
	},

	onDelete: function () {
		if (!this.creationCancelled)
			this.onHide();
	},

	updateLayersVisibility: function () {
		let hideCapturePoints = this.getWidgetById("hideCapturePoints").getValue(),
			hidePathsConnections = this.getWidgetById("hidePathsConnections").getValue();

		for (let path of this.paths) {
			let hidePaths = this.getWidgetById(path.hidePathsWidgetId).getValue();

			if (hidePathsConnections) {
				path.pathGroup.remove();
				path.connectionsGroup.remove();
			} else {
				this.hideOrShowLayer(hidePaths, path.pathGroup);
				this.hideOrShowLayer(hidePaths, path.actualPathGroup);
				this.hideOrShowLayer(hidePaths, path.connectionsGroup);
			}

			if (hideCapturePoints)
				path.pointsGroup.remove();
			else
				this.hideOrShowLayer(hidePaths, path.pointsGroup);

			this.hideOrShowLayer(hidePaths, path.actualPathGroup);
		}

		this._doHidePolygonWidgets = this.getWidgetById("hidePolygonWidgets").getValue();
		this.hideOrShowLayer(this._doHidePolygonWidgets || this._shouldHideEverything, this.widgetsGroup);
		this._doHidePathsNumbers = this.getWidgetById("hideNumbers").getValue();
	},

	setColor: function (widget) {
		this[widget.id] = widget.getValue();
		this.calculateParameters();
		this.updatePolygonsColors();
	},

	updatePolygonsColors: function () {
		let color = this.getWidgetById("borderColor").getValue(),
			fillColor = this.getWidgetById("fillColor").getValue();
		this.forEachValidPolygon(polygon => polygon.setStyle({color, fillColor}));
	},

	clearPaths: function () {
		for (let path of this.paths) {
			let groups = [path.pathGroup, path.connectionsGroup, path.pointsGroup, path.actualPathGroup];
			for (let group of groups)
				group.clearLayers();
		}
	},

	onEditStart: function () {
		if (!this.isSelected)
			return;

		for (let group of this.groupsToHideOnEditStart) {
			if (group)
				this.hideOrShowLayer(true, group);
		}
	},

	/**
	 * Clears labels which IDs are contained in `arrayProperty`.
	 * @param arrayProperty {string} A property of `this` that contains labels' IDs to clear
	 */
	clearLabels: function (arrayProperty) {
		for (let id of this[arrayProperty])
			this.labelsGroup.deleteLabel(id);
		this[arrayProperty] = [];
	},

	/**
	 * Copies polygons and airport to the array for merging it to collection later
	 * @returns {Object[]} Array of features to merge
	 */
	baseFeaturesToGeoJSON: function () {
		let jsons = [];

		this.forEachValidPolygon(polygon => {
			let polygonJson = polygon.toGeoJSON(),
				props = ["minHeight", "maxHeight", "meanHeight", "absoluteHeight", "reliefType", "elevationDifference", "latCellSizeInMeters", "lngCellSizeInMeters"];
			for (let prop of props) {
				let value = polygon[prop];
				if (value !== undefined)
					polygonJson.properties[prop] = value;
			}
			polygonJson.properties.name = polygon.polygonName || "Area to capture";
			jsons.push(polygonJson);
		});

		let airport = this.airportMarker.toGeoJSON();
		airport.properties.name = "Airport";
		jsons.push(airport);

		return jsons;
	},

});

require("./DEM.js");
require("./polygons.js");
require("./serialization.js");