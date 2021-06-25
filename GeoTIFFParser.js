// TODO: Fix this nonsense
// Thanks to parcel (which is used by geotiff) for this nightmare
//const geotiff = require("./node_modules/geotiff/src/geotiff.js"); // For browser
const geotiff = require("geotiff"); // For testing in electron
const turfHelpers = require("@turf/helpers");
const bbox = require("@turf/bbox").default;
const bboxPolygon = require('@turf/bbox-polygon').default;
const intersect = require("@turf/intersect").default;
const proj4 = require("proj4");
const MathTools = require("./MathTools.js");

/**
 * Parses GeoTIFF files
 * @param file {File} File to parse
 * @param projectionString {string} Projection string in WKT or proj4 format. Pass empty string if there's no projection information. In this case, WGS84 assumed.
 * @param initialData {Object} Result of {@link ESRIGridParser.getInitialData}
 * @return {Promise<Object>} Calculated stats
 */
module.exports = async function (file, projectionString, initialData) {
	let polygonStats = {};
	let tiff = await geotiff.fromBlob(file);
	let imageCount = await tiff.getImageCount();
	for (let i = 0; i < imageCount; i++) {
		let image = await tiff.getImage(i);

		// Get info about image
		let origin = image.getOrigin(), leftX = origin[0], topY = origin[1];
		let nodata = image.getGDALNoData();
		let resolution = image.getResolution(), xSize = resolution[0], ySize = resolution[1], zScale = resolution[2];
		if (zScale === 0)
			zScale = 1;
		let rightX = leftX + image.getWidth() * xSize, bottomY = topY + image.getHeight() * ySize;
		let imagePolygon = turfHelpers.polygon([[
			[leftX, topY], [rightX, topY], [rightX, bottomY], [leftX, bottomY], [leftX, topY]
		]]);

		let hasProj = projectionString !== "", projectionFromWGS;
		if (hasProj)
			projectionFromWGS = proj4("WGS84", projectionString);

		for (let name in initialData) {
			// Let's project each polygon to the image, get their intersection part and calculate statistics for it
			let polygon = initialData[name];
			let oldBbox = [
				polygon[0], [polygon[1][0], polygon[0][1]], polygon[1], [polygon[0][0], polygon[1][1]], polygon[0]
			];

			let newBbox;
			if (!hasProj)
				newBbox = turfHelpers.polygon([oldBbox]);
			else {
				newBbox = [];
				for (let point of oldBbox)
					newBbox.push(projectionFromWGS.forward(point));

				newBbox = bboxPolygon(
					bbox(
						turfHelpers.polygon([newBbox])
					)
				);
			}

			let intersection = intersect(imagePolygon, newBbox);
			if (!intersection)
				continue;

			intersection = intersection.geometry.coordinates[0];
			let points = [intersection[0], intersection[2]];
			let imageWindow = [];
			for (let point of points) {
				imageWindow.push(
					Math.floor((point[0] - leftX) / xSize),
					Math.floor((point[1] - topY) / ySize),
				);
			}
			// In most SRS Y is directed upwards but in image Y is directed downwards, so we should swap it. Check needed because some SRS might use downward direction.
			let y1 = imageWindow[1], y2 = imageWindow[3];
			if (y1 > y2) {
				imageWindow[1] = y2;
				imageWindow[3] = y1;
			}

			// geotiff.js will mash all pixels into one array.
			// To easily keep track of coordinates and reduce memory consumption, we need to read image row by row.
			let minX = imageWindow[0], maxX = imageWindow[2];
			let currentY = imageWindow[1], maxY = imageWindow [3];

			// Stats for current polygon
			let stats = {
				min: Infinity,
				max: -Infinity,
			}

			for (currentY; currentY <= maxY; currentY++) {
				let currentX = minX;
				let raster = await image.readRasters({ window: [minX, currentY, maxX, currentY + 1] });
				let color0 = raster[0]; // Raster is a TypedArray where elements are colors and their elements are pixel values of that color.
				let index = -1;
				for (let pixel of color0) {
					let point = [origin[0] + currentX * xSize, origin[1] + currentY * ySize];
					currentX++; // So we can continue without incrementing
					index++;
					if (hasProj)
						point = projectionFromWGS.inverse(point);
					if (!MathTools.isPointInRectangle(point, polygon))
						continue;

					let value = 0;
					for (let color of raster)
						value += color[index];
					value = value / raster.length;
					let multipliedValue = value * zScale;
					if (value === nodata || multipliedValue === nodata)
						continue;

					if (multipliedValue < stats.min)
						stats.min = multipliedValue;
					if (multipliedValue > stats.max)
						stats.max = multipliedValue;
				}
			}
			polygonStats[name] = stats;
		}
	}
	return polygonStats;
}