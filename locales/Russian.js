L.ALS.Locales.addLocaleProperties("Русский", {

	// SynthGridWizard

	gridWizardDisplayName: "Слой Сетки",
	gridWizardNotification: `Если масштаб карты слишком мелкий, сетка будет скрыта. Пожалуйста, увеличьте масштаб карты, чтобы ее увидеть.
	
	Чтобы выделить полигон, либо нажмите на него правой кнопкой мыши (или тапните и задержите палец) или два раза кликните (тапните) на него.`,

	gridStandardScales: "Масштаб сетки:",
	gridLngDistance: "Расстояние между параллелями:",
	gridLatDistance: "Расстояние между меридианами:",

	// SynthGridLayer

	gridLayerDefaultName: "Слой Сетки",
	hidePolygonWidgets: "Скрыть виджеты на карте",
	hideNumbers: "Скрыть номера точек на карте",
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
	lngPathsCount: "Число маршрутов в одной ячейке по параллелям",
	latPathsCount: "Число маршрутов в одной ячейке по меридианам",
	lngPathsLength: "Длина маршрутов по параллелям",
	latPathsLength: "Длина маршрутов по меридианам",
	lngFlightTime: "Время полета по параллеям",
	latFlightTime: "Время полета по меридианам",
	lngCellSizeInMeters: "Средняя ширина ячейки",
	latCellSizeInMeters: "Средняя высота сетки",
	selectedArea: "Площадь выделенных полигонов",
	flightHeight: "Высота полета (m)",
	lx: "Высота изображения, lx",
	Lx: "Высота изображения на местности, Lx",
	Bx: "Расстояние между точками фотографирования, Bx",
	ly: "Ширина изображения, ly",
	Ly: "Ширина изображения на местности, Ly",
	By: "Расстояние между соседними маршрутами, By",

	airportForLayer: "Аэропорт для слоя",

	minHeight: "Мин. высота (m):",
	maxHeight: "Макс. высота (m):",
	meanHeight: "Ср. высота",
	absoluteHeight: "Абс. высота",
	elevationDifference: "(Макс. высота - Мин. высота) / Высота полета",
	reliefType: "Тип рельефа",

	errorDistanceHasNotBeenCalculated: "Расстояние между маршрутами не было вычислено!",
	errorPathsCountTooBig: "Вычисленное количество маршрутов слишком велико, оно должно быть меньше 20. Пожалуйста, проверьте ваши значения.",
	errorCamHeight: "Высота камеры больше ширины камеры!",
	errorPathsCountTooSmall: "Вычисленное количество маршрутов слишком мало, оно должно быть больше 2. Пожалуйста, проверьте ваши значения",
	errorMinHeightBiggerThanMaxHeight: "Мин. высота должна быть меньше или равна макс. высоте!",

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

	thirdParagraph: "Разработка SynthFlight возможна, благодаря следующему свободному ПО:",

	fourthParagraph: "Использование карт возможно, благодаря следующим геосервисам:",

});