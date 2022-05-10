L.ALS.Locales.addLocaleProperties("Русский", {
	// Labels on dateline
	moveLabelWest: "Сдвиньте карту дальше влево, чтобы перейти на восточную сторону",
	moveLabelEast: "Сдвиньте карту дальше вправо, чтобы перейти на западную сторону",

	// SynthBaseLayer
	connectionMethod: "Метод соединения маршрутов",
	allIntoOne: "Все в один",
	oneFlightPerPath: "Один полет на маршрут",
	pathsSpoilerTitle: "Информация о маршрутах",
	pathTitle: "Маршрут",
	flashPath: "Помигать маршрутом",
	pathLength: "Длина маршрута",
	flightTime: "Время полета",
	flightTimeWarning: "Время полета превышает 4 часа. Подумайте, не стоит ли разбить съемочный участок, содержащий данный маршрут, на несколько участков.",

	// SynthLineWizard
	lineLayerName: "Слой Линий",

	// SynthLineLayer
	lineLayerColor: "Цвет линий:",
	settingsLineLayerColor: "Цвет линий по умолчанию:",
	lineLayersSkipped: "Одна или несколько линий были пропущены, так как они слишком длинные. Данные линии имеют красный цвет.",

	// SynthGridWizard

	gridWizardDisplayName: "Слой Сетки",
	gridWizardNotification: `Если масштаб карты слишком мелкий, сетка будет скрыта. Пожалуйста, увеличьте масштаб карты, чтобы ее увидеть.
	
	Чтобы выделить трапецию, либо нажмите на него правой кнопкой мыши (или тапните и задержите палец) или два раза кликните (тапните) на него.`,

	gridStandardScales: "Масштаб сетки:",
	gridLngDistance: "Расстояние между параллелями:",
	gridLatDistance: "Расстояние между меридианами:",
	gridShouldMergeCells: "Объединять соседние трапеции при широте выше 60°",

	// SynthGridLayer

	alphabet: "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ", // Don't add it, if you don't need different symbols in cells' names
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
	meanHeight: "Ср. высота (m)",
	meanFromMinMax: "Вычислить ср. высоту из мин. и макс. высот",
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

	jsonNoPaths1: "Маршруты не были добавлены в слое",
	jsonNoPaths2: "будет экспортирована только геометрия и положение аэропорта.",

	// SynthGridSettings

	defaultGridBorderColor: "Цвет обводки сетки по умолчанию:",
	defaultGridFillColor: "Цвет заливки сетки по умолчанию:",
	defaultMeridiansColor: "Цвет маршрутов по меридианам по умолчанию:",
	defaultParallelsColor: "Цвет маршрутов по параллелям по умолчанию:",
	defaultLineThickness: "Толщина линий по умолчанию:",
	gridHidingFactor: "Увеличить отзывчивость, скрывая сетку при более мелком масштабе. Чем выше это значение, тем отзывчивее будет программа:",

	// SynthRectangleLayer
	rectangleLayerName: "Слой Прямоугольников",
	defaultRectangleBorderColor: "Цвет обводки прямоугольников по умолчанию:",
	defaultRectangleFillColor: "Цвет заливки прямоугольников по умолчанию:",
	rectangleBorderColor: "Цвет обводки прямоугольников:",
	rectangleFillColor: "Цвет заливки прямоугольников:",
	rectangleLayersSkipped: "Один или несколько прямоугольников были пропущены, так как они слишком большие. Данные прямоугольники имеют красный цвет.",

	// SynthGeometryWizard

	geometryDisplayName: "Слой Геометрии",
	geometryFileLabel: "Сжатый shapefile (zip-архив) или GeoJSON:",
	geometryNotification: "Чтобы просмотреть семантику объекта, нажмите на него. Позже вы можете выполнить поиск по семантике, нажав кнопку поиска на панели программы.",

	// SynthGeometryLayer

	geometryOutOfBounds: "Объекты в выбранном файле выходят за границы видимой области. Пожалуйста, проверьте проекцию и/или добавьте в архив файл .prj",
	geometryInvalidFile: "Выбранный файл не является shapefile-ом или файлом GeoJSON",
	geometryNoFeatures: "Выбранный файл не содержит объектов, поэтому не будет добавлен",
	geometryBorderColor: "Цвет обводки:",
	geometryFillColor: "Цвет заливки:",
	geometryBrowserNotSupported: "Ваш браузер не поддерживает добавление данного слоя, но вы можете открывать проекты, использующие этот слой.",
	geometryNoFileSelected: "Файл не был выбран. Пожалуйста, выберете файл, который хотите добавить, и попробуйте снова.",

	// SynthGeometrySettings

	geometryDefaultFillColor: "Цвет заливки по умолчанию:",
	geometryDefaultBorderColor: "Цвет обводки по умолчанию:",

	// SynthPolygonLayer
	polygonLayerName: "Слой Полигонов",
	polygonPathsColor: "Цвет маршрутов:",
	polygonHidePaths: "Скрыть маршруты",
	polygonLayersSkipped: "Один или несколько полигонов были пропущены, так как они слишком большие. Данные полигоны имеют красный цвет.",

	// GeoJSON initial features
	initialFeaturesFileLabelPolygon: "Загрузить исходные полигоны из сжатого shapefile (zip-архива) или GeoJSON (типы, отличные от полигона, будут пропущены):",
	initialFeaturesFileLabelLine: "Загрузить исходные полилинии из сжатого shapefile (zip-архива) или GeoJSON (типы, отличные от пололинии, будут пропущены):",
	initialFeaturesNoFeatures: "Выбранный файл не содержит ни одного объекта, поддерживаемого добавляемым слоем",

	// Search
	searchButtonTitle: "Поиск в Слоях Геометрии и OSM",
	searchPlaceholder: "Начните вводить для поиска...",
	searchCloseButton: "Закрыть",
	searchNoOSMResults: "Нет результатов в OSM",
	searchOSMResults: "Результаты в OSM",
	searchNoLayersResults: "Нет результатов в Слоях Геометрии",
	searchLayersResults: "Результаты в слоях геометрии",

	searchInvalidJson: "GeoJSON, полученный от сервера OSM, невалидный. У них что-то не работает, поэтому поиск в OSM временно недоступен.",
	searchCantConnect: "Невозможно подключиться к серверу OSM. Пожалуйста, проверьте ваше подключение к Интернету. Также сервер OSM может не работать, в таком случае поиск в OSM временно недоступен.",

	searchBadResponse1: "Ошибка, сервер OSM отправил следующее сообщение",
	searchBadResponse2: "Пожалуйста, попробуйте открыть",
	searchBadResponse3: "поиск OSM в браузере",
	searchBadResponse4: "Если он не работает, поиск в OSM временно недоступен. Иначе, пожалуйста, создайте сообщение об ошибке в",
	searchBadResponse5: "репозитории SynthFlight",

	// About

	firstParagraph: "SynthFlight – это полностью клиентское программное обеспечение для проектирования аэрофотосъемочных работ. Это beta-версия, поэтому ожидаемы баги, большие изменения API, отсутствие обратной совместимости и т.д.",

	secondParagraphPart1: "Посетите",
	secondParagraphPart2: "страницу проекта на GitHub",
	secondParagraphPart3: "для дополнительной информации (на английском языке).",

	thirdParagraph: "Разработка SynthFlight возможна, благодаря различному свободному ПО.",

	fourthParagraph: "Использование карт возможно, благодаря следующим геосервисам:",

	fifthParagraph: "Поиск по Интернету осуществляется через OpenStreetMaps при помощи", // ... Nominatim API

});