L.ALS.Locales.addLocaleProperties("English", {

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
	lngPathsCount: "Paths count in one cell by parallels",
	latPathsCount: "Paths count in one cell by meridians",
	lngPathsLength: "Length of paths by parallels",
	latPathsLength: "Length of paths by meridians",
	lngFlightTime: "Flight time by parallels",
	latFlightTime: "Flight time by meridians",
	lngCellSizeInMeters: "Mean cell width",
	latCellSizeInMeters: "Mean cell height",
	selectedArea: "Selected area",
	flightHeight: "Flight height (m)",
	lx: "Image height, lx",
	Lx: "Image height on the ground, Lx",
	Bx: "Distance between photographing positions, Bx",
	ly: "Image width, ly",
	Ly: "Image width on the ground, Ly",
	By: "Distance between adjacent paths, By",
	GSI: "GSI",
	IFOV: "IFOV",
	GIFOV: "GIFOV",
	FOV: "FOV",
	GFOV: "GFOV",

	airportForLayer: "Airport for layer",

	minHeight: "Min. height (m):",
	maxHeight: "Max. height (m):",
	meanHeight: "Mean height",
	absoluteHeight: "Absolute height",
	elevationDifference: "(Max. height - Min. height) / Flight height",
	reliefType: "Relief type",

	errorDistanceHasNotBeenCalculated: "Distance between paths hasn't been calculated!",
	errorPathsCountTooBig: "Calculated paths count is too big, it should be less than 20. Please, check your values.",
	errorCamHeight: "Camera height is greater than camera width!",
	errorPathsCountTooSmall: "Calculated paths count is too small, it should be greater than 2. Please, check your values.",
	errorMinHeightBiggerThanMaxHeight: "Min. height should be less than or equal to max. height!",

	DEMFiles: "Load DEM files to calculate statistics:",
	confirmDEMLoading: "Are you sure you want to load DEMs? It will override current statistics and take some time.",
	DEMError: "Sorry, an error occurred while loading one of your files", //TODO: Add file name

	// SynthGridSettings

	defaultGridBorderColor: "Default grid border color:",
	defaultGridFillColor: "Default grid fill color:",
	defaultMeridiansColor: "Paths by meridians default color:",
	defaultParallelsColor: "Paths by parallels default color:",
	defaultLineThickness: "Default line thickness:",
	gridHidingFactor: "Increase responsiveness by hiding grid at smaller map scales. The higher this value, the more responsive program will be:",

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

	thirdParagraph: "Developing SynthFlight is possible thanks to following open-source software:",

	fourthParagraph: "Using maps is possible thanks to following geoservices:",

});