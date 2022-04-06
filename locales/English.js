L.ALS.Locales.addLocaleProperties("English", {

	// SynthBaseLayer
	connectionMethod: "Path connection method",
	allIntoOne: "All into one",
	oneFlightPerPath: "One flight per path",
	pathsSpoilerTitle: "Paths details",
	pathTitle: "Path",
	flashPath: "Flash path",
	pathLength: "Path length",
	flightTime: "Flight time",
	flightTimeWarning: "Flight time exceeds 4 hours. Consider splitting capture area that contains this path into chunks.",

	// SynthLineWizard
	lineLayerName: "Line Layer",

	// SynthLineLayer
	lineLayerColor: "Line color:",
	settingsLineLayerColor: "Default line color:",

	// SynthGridWizard

	gridWizardDisplayName: "Grid Layer",
	gridWizardNotification: `If map scale is too low, grid will be hidden. Please, zoom in to see it.
	
	To select a polygon, either click right mouse button (or tap and hold) or double-click (or double-tap) on it.`,

	gridStandardScales: "Grid scale:",
	gridLngDistance: "Distance between parallels:",
	gridLatDistance: "Distance between meridians:",
	gridShouldMergeCells: "Merge couples of adjacent cells when latitude exceeds 60° and merge again when it exceeds 76° (except 1:1 000 000 and 1:2 000 scales when cells above 76° triple-merged instead of quadruple-merged)",

	// SynthGridLayer

	alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", // Don't add it, if you don't need different symbols in cells' names
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
	meanHeight: "Mean height (m)",
	meanFromMinMax: "Get mean height from min. and max. heights",
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
	defaultRectangleBorderColor: "Default rectangle border color:",
	defaultRectangleFillColor: "Default rectangle fill color:",
	rectangleBorderColor: "Rectangle border color:",
	rectangleFillColor: "Rectangle fill color:",
	rectangleLayersRemoved: "One or more rectangles has been removed because they're too big",

	// SynthGeometryWizard

	geometryDisplayName: "Geometry Layer",
	geometryFileLabel: "Zipped shapefile or GeoJSON:",
	geometryNotification: "Click/tap on features to see the semantics", // TODO: Add tip for searching by semantics when search will be added

	// SynthGeometryLayer

	geometryOutOfBounds: "Features in selected file are out of visible area. Please, check projection and/or add .prj file to the archive.",
	geometryInvalidFile: "This file is not valid zipped shapefile or GeoJSON file",
	geometryNoFeatures: "This file doesn't contain any features, so it won't be added",
	geometryBorderColor: "Border color:",
	geometryFillColor: "Fill color:",
	geometryBrowserNotSupported: "Your browser doesn't support adding this layer. You still can open projects with this layer though.",
	geometryNoFileSelected: "No file has been selected. Please, select a file that you want to add and try again.",

	// SynthGeometrySettings

	geometryDefaultFillColor: "Default fill color:",
	geometryDefaultBorderColor: "Default border color:",

	// Search
	searchButtonTitle: "Search Geometry Layers or OSM",
	searchPlaceholder: "Type to search...",
	searchCloseButton: "Close",
	searchNoOSMResults: "No results in OSM",
	searchOSMResults: "Results in OSM",
	searchNoLayersResults: "No results in Geometry Layers",
	searchLayersResults: "Results in Geometry Layers",

	searchInvalidJson: "GeoJSON returned by the OSM server is invalid. Something's not working here, so OSM search is temporarily unavailable.",
	searchCantConnect: "Can't connect to the OSM server. Please, check your Internet connection. Also, OSM might be down in which case OSM search is temporarily unavailable.",

	searchBadResponse1: "Error, OSM server responded with the following message",
	searchBadResponse2: "Please, try opening",
	searchBadResponse3: "OSM search in browser",
	searchBadResponse4: "If it doesn't work, OSM search is temporarily unavailable. Otherwise, please, create an issue at",
	searchBadResponse5: "SynthFlight repository",

	// About

	firstParagraph: "SynthFlight is a fully client-side software for planning aerial photography. This is a beta version so bugs, huge API changes and lack of backwards compatibility are to be expected.",

	secondParagraphPart1: "Visit project's",
	secondParagraphPart2: "GitHub page",
	secondParagraphPart3: "for more information.",

	thirdParagraph: "Developing SynthFlight is possible thanks to various open-source software.",

	fourthParagraph: "Using maps is possible thanks to following geoservices:",

	fifthParagraph: "Web search is powered by OpenStreetMaps and", // ... Nominatim API

});