L.ALS.Locales.addLocaleProperties("Русский", {

	// SynthBaseLayer
	connectionMethod: "Метод соединения маршрутов",
	allIntoOne: "Все в один",
	oneFlightPerPath: "Один полет на маршрут",
	pathSpoiler: "Маршрут",
	flashPath: "Помигать маршрутом",
	pathLength: "Длина маршрута",
	flightTime: "Время полета",
	flightTimeWarning: "Время полета превышает 4 часа. Подумайте, не стоит ли разбить съемочный участок, содержащий данный маршрут, на несколько участков.",

	// SynthLineWizard
	lineLayerName: "Слой Линий",
	lineLayerWizardLabel: "Этот слой находится в разработке, пока ничего не делает и может сломать приложение, если его добавить",

	// SynthLineLayer
	lineLayerColor: "Цвет линий:",

	// SynthGridWizard

	gridWizardDisplayName: "Слой Сетки",
	gridWizardNotification: `Если масштаб карты слишком мелкий, сетка будет скрыта. Пожалуйста, увеличьте масштаб карты, чтобы ее увидеть.
	
	Чтобы выделить трапецию, либо нажмите на него правой кнопкой мыши (или тапните и задержите палец) или два раза кликните (тапните) на него.`,

	gridStandardScales: "Масштаб сетки:",
	gridLngDistance: "Расстояние между параллелями:",
	gridLatDistance: "Расстояние между меридианами:",

	// SynthGridLayer

	gridLayerDefaultName: "Слой Сетки",
	hidePolygonWidgets: "Скрыть виджеты на карте",
	hideNumbers: "Скрыть номера точек на карте",
	hideCapturePoints: "Скрыть точки съемки",
	hidePathsConnections: "Скрыть соединения маршрутов",
	hidePathsByMeridians: "Скрыть маршруты по меридианам",
	hidePathsByParallels: "Скрыть маршруты по параллелям",
	lineThickness: "Толщина линий:",
	gridBorderColor: "Цвет обводки сетки:",
	gridFillColor: "Цвет заливки сетки:",
	meridiansColor: "Цвет маршрутов по меридианам:",
	parallelsColor: "Цвет маршрутов по параллелям:",
	airportLat: "Широта аэропорта:",
	airportLng: "Долгота аэропорта:",
	aircraftSpeed: "Скорость самолета (km/h):",
	imageScale: "Делитель масштаба изображения:",
	cameraWidth: "Ширина камеры (px):",
	cameraHeight: "Высота камеры (px):",
	pixelWidth: "Размер пикселя (μm):",
	overlayBetweenPaths: "Перекрытие между изображениями с соседних маршрутов (%):",
	overlayBetweenImages: "Перекрытие между изображениями с одного маршрута (%):",
	focalLength: "Фокусное расстояние (mm):",
	selectedArea: "Площадь выделенных трапеций",
	flightHeight: "Высота полета",
	lx: "Высота изображения, lx",
	Lx: "Высота изображения на местности, Lx",
	Bx: "Расстояние между точками фотографирования, Bx",
	ly: "Ширина изображения, ly",
	Ly: "Ширина изображения на местности, Ly",
	By: "Расстояние между соседними маршрутами, By",
	timeBetweenCaptures: "Временной промежуток между снимками",

	airportForLayer: "Аэропорт для слоя",

	zoneNumber: "Номер участка",
	minHeight: "Мин. высота (m):",
	maxHeight: "Макс. высота (m):",
	meanHeight: "Ср. высота",
	absoluteHeight: "Абс. высота",
	elevationDifference: "(Макс. высота - Мин. высота) / Высота полета",
	reliefType: "Тип рельефа",
	lngPathsCount: "Число маршрутов по параллелям",
	latPathsCount: "Число маршрутов по меридианам",
	lngCellSizeInMeters: "Ширина трапеции",
	latCellSizeInMeters: "Высота трапеции",

	errorDistanceHasNotBeenCalculated: "Расстояние между маршрутами не было вычислено!",
	errorPathsCountTooBig: "Вычисленное количество маршрутов слишком велико. Пожалуйста, проверьте ваши значения.",
	errorCamHeight: "Высота камеры больше ширины камеры!",
	errorPathsCountTooSmall: "Вычисленное количество маршрутов слишком мало. Пожалуйста, проверьте ваши значения",
	errorMinHeightBiggerThanMaxHeight: "Мин. высота должна быть меньше или равна макс. высоте!",

	DEMFiles: "Загрузить файлы ЦМР для расчета статистики. Выберете файлы GeoTIFF или ASCII Grid. Выберете файлы .prj или .aux.xml с такими же именами для перезаписи CRS. Если для ASCII Grid не выбран ни один из этих файлов, предполагается, что используется WGS84.",
	DEMFilesWhenGeoTIFFNotSupported: "Загрузить файлы ЦМР в формате ASCII Grid для расчета статистики. По умолчанию предполагается, что файлы используют WGS84. Для перезаписи системы координат выберете файлы .prj or .aux.xml с такими же именами.",
	DEMFilesIE9: "Загрузить файл ЦМР в формате ASCII Grid для расчета статистики. Этот файл должен использовать WGS84.",
	confirmDEMLoading: "Вы уверены, что хотите загрузить файлы ЦМР? Это перезапишет текущую статистику и займет некоторое время.",
	loadingDEM: "Выбранные вами файлы ЦМР загружаются, это может занять некоторое время...",
	notGridNotSupported: "Извините, ваш браузер не поддерживает ничего, кроме ASCII Grid. Пожалуйста, выберете файл ASCII Grid.",
	DEMError: "Извините, во время загрузки одного из ваших файлов произошла ошибка",

	// SynthGridSettings

	defaultGridBorderColor: "Цвет обводки сетки по умолчанию:",
	defaultGridFillColor: "Цвет заливки сетки по умолчанию:",
	defaultMeridiansColor: "Цвет маршрутов по меридианам по умолчанию:",
	defaultParallelsColor: "Цвет маршрутов по параллелям по умолчанию:",
	defaultLineThickness: "Толщина линий по умолчанию:",
	gridHidingFactor: "Увеличить отзывчивость, скрывая сетку при более мелком масштабе. Чем выше это значение, тем отзывчивее будет программа:",

	// SynthShapefileWizard

	shapefileDisplayName: "Слой Shapefile",
	zippedShapefile: "Сжатый shapefile (zip-архив):",

	// SynthShapefileLayer

	shapefileDefaultName: "Сжатый Shapefile",
	shapefileNoFeatures: "Этот shapefile не содержит объектов, поэтому не будет добавлен",
	shapefileBroken: "Экстент этого shapefile неправильный, слой не будет полностью отображен на карте. Пожалуйста, откройте его в вашей любимой ГИС и исправьте экстент",
	shapefileNotValid: "Этот файл не является shapefile-ом",
	shapefileBorderColor: "Цвет обводки:",
	shapefileFillColor: "Цвет заливки:",

	// Shapefile settings

	shapefileDefaultFillColor: "Цвет заливки по умолчанию:",
	shapefileDefaultBorderColor: "Цвет обводки по умолчанию:",

	// About

	firstParagraph: "SynthFlight – это полностью клиентское программное обеспечение для проектирования аэрофотосъемочных работ. Это alpha-версия, поэтому ожидаемы баги, ошибки, отсутсвие функциональности, изменения API и т.д.",

	secondParagraphPart1: "Посетите",
	secondParagraphPart2: "страницу проекта на GitHub",
	secondParagraphPart3: "для дополнительной информации (на английском языке).",

	thirdParagraph: "Разработка SynthFlight возможна, благодаря различному свободному ПО.",

	fourthParagraph: "Использование карт возможно, благодаря следующим геосервисам:",

});