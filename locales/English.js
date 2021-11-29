L.ALS.Locales.addLocaleProperties("English", {

	// SynthBaseLayer
	connectionMethod: "Path connection method",
	allIntoOne: "All into one",
	oneFlightPerPath: "One flight per path",
	pathSpoiler: "Path",
	flashPath: "Flash path",
	pathLength: "Path length",
	flightTime: "Flight time",
	flightTimeWarning: "Flight time exceeds 4 hours. Consider splitting capture area that contains this path into chunks.",

	// SynthLineWizard
	lineLayerName: "Line Layer",

	// SynthLineLayer
	lineLayerColor: "Line color:",

	// SynthGridWizard

	gridWizardDisplayName: "Grid Layer",
	gridWizardNotification: `If map scale is too low, grid will be hidden. Please, zoom in to see it.
	
	To select a polygon, either click right mouse button (or tap and hold) or double-click (or double-tap) on it.`,

	gridStandardScales: "Grid scale:",
	gridLngDistance: "Distance between parallels:",
	gridLatDistance: "Distance between meridians:",

	// SynthGridLayer

	gridLayerDefaultName: "Grid Layer",
	hidePolygonWidgets: "Hide widgets on the map",
	hideNumbers: "Hide points' numbers on the map",
	hideCapturePoints: "Hide capture points",
	hidePathsConnections: "Hide paths' connections",
	hidePathsByMeridians: "Hide paths by meridians",
	hidePathsByParallels: "Hide paths by parallels",
	lineThickness: "Line thickness:",
	gridBorderColor: "Border color:",
	gridFillColor: "Fill color:",
	meridiansColor: "Paths by meridians color:",
	parallelsColor: "Paths by parallels color:",
	airportLat: "Airport latitude:",
	airportLng: "Airport longitude:",
	aircraftSpeed: "Aircraft speed (km/h):",
	imageScale: "Image scale denominator:",
	cameraWidth: "Camera width (px):",
	cameraHeight: "Camera height (px):",
	pixelWidth: "Pixel size (μm):",
	overlayBetweenPaths: "Overlay between images from adjacent paths (%):",
	overlayBetweenImages: "Overlay between images from the same path (%):",
	focalLength: "Focal length (mm):",
	selectedArea: "Selected area",
	flightHeight: "Flight height",
	lx: "Image height, lx",
	Lx: "Image height on the ground, Lx",
	Bx: "Distance between photographing positions, Bx",
	ly: "Image width, ly",
	Ly: "Image width on the ground, Ly",
	By: "Distance between adjacent paths, By",
	timeBetweenCaptures: "Time between captures",
	GSI: "GSI",
	IFOV: "IFOV",
	GIFOV: "GIFOV",
	FOV: "FOV",
	GFOV: "GFOV",

	airportForLayer: "Airport for layer",

	zoneNumber: "Zone number",
	minHeight: "Min. height (m):",
	maxHeight: "Max. height (m):",
	meanHeight: "Mean height",
	absoluteHeight: "Absolute height",
	elevationDifference: "(Max. height - Min. height) / Flight height",
	reliefType: "Relief type",
	lngPathsCount: "Paths count by parallels",
	latPathsCount: "Paths count by meridians",
	lngCellSizeInMeters: "Cell width",
	latCellSizeInMeters: "Cell height",

	errorDistanceHasNotBeenCalculated: "Distance between paths hasn't been calculated!",
	errorPathsCountTooBig: "Calculated paths count is too big. Please, check your values.",
	errorCamHeight: "Camera height is greater than camera width!",
	errorPathsCountTooSmall: "Calculated paths count is too small. Please, check your values.",
	errorMinHeightBiggerThanMaxHeight: "Min. height should be less than or equal to max. height!",

	DEMFiles: "Load DEM files to calculate statistics. Select GeoTIFF or ASCII Grid files. Select .prj or .aux.xml files with the same name to override CRS. For ASCII Grid, if no of these file selected, WGS84 is assumed.",
	DEMFilesWhenGeoTIFFNotSupported: "Load ASCII Grid DEM files to calculate statistics. By default, WGS84 assumed. To override it, select .prj or .aux.xml files with the same name.",
	DEMFilesIE9: "Load ASCII Grid DEM file to calculate statistics. This file should use WGS84.",
	confirmDEMLoading: "Are you sure you want to load DEMs? It will override current statistics and take some time.",
	loadingDEM: "Loading selected DEM files, it might take a while...",
	notGridNotSupported: "Sorry, your browser doesn't support anything other than ASCII Grid. Please, select a valid ASCII Grid file.",
	DEMError: "Sorry, an error occurred while loading one of your files", //TODO: Add file name

	// SynthGridSettings

	defaultGridBorderColor: "Default grid border color:",
	defaultGridFillColor: "Default grid fill color:",
	defaultMeridiansColor: "Paths by meridians default color:",
	defaultParallelsColor: "Paths by parallels default color:",
	defaultLineThickness: "Default line thickness:",
	gridHidingFactor: "Increase responsiveness by hiding grid at smaller map scales. The higher this value, the more responsive program will be:",

	// SynthRectangleLayer
	rectangleLayerName: "Rectangle Layer",
	defaultRectangleBorderColor: "Default border color:",
	defaultRectangleFillColor: "Default fill color:",
	rectangleBorderColor: "Rectangle border color:",
	rectangleFillColor: "Rectangle fill color:",

	// SynthShapefileWizard

	shapefileDisplayName: "Zipped Shapefile Layer",
	zippedShapefile: "Zipped shapefile:",

	// SynthShapefileLayer

	shapefileDefaultName: "Zipped Shapefile",
	shapefileNoFeatures: "This shapefile doesn't contain any features so it won't be added",
	shapefileBroken: "Extent of this shapefile is broken, layer won't be fully displayed on the map. Please, open it in your favourite GIS and fix the extent.",
	shapefileNotValid: "This file is not valid zipped shapefile",
	shapefileBorderColor: "Border color:",
	shapefileFillColor: "Fill color:",

	// Shapefile settings

	shapefileDefaultFillColor: "Default fill color:",
	shapefileDefaultBorderColor: "Default border color:",

	// About

	firstParagraph: "SynthFlight is a fully client-side software for planning aerial photography. This is an alpha version, so expect bugs, crashes, errors, missing functions, API changes, etc.",

	secondParagraphPart1: "Visit project's",
	secondParagraphPart2: "GitHub page",
	secondParagraphPart3: "for more information.",

	thirdParagraph: "Developing SynthFlight is possible thanks to various open-source software.",

	fourthParagraph: "Using maps is possible thanks to following geoservices:",

});