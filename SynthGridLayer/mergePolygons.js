const polybool = require("polybooljs");
const MathTools = require("../MathTools.js");

L.ALS.SynthGridLayer.prototype.mergePolygons = function () {
	L.ALS.SynthRectangleBaseLayer.prototype.mergePolygons.call(this);

	// Until there's no adjacent polygons, compare each polygon to each and try to find adjacent one. Then merge it.
	while (true) {
		let toMerge;
		for (let poly1 of this.mergedPolygons) {
			for (let poly2 of this.mergedPolygons) {
				if (poly1 === poly2 || poly1.zoneNumber !== poly2.zoneNumber)
					continue;

				// Check if we have a small polygon completely inside of a big one, i.e., if it could form a hole.
				// We need a special algorithm because a small polygon might have all common points, but not any common
				// edges. In such case, polygons shouldn't be merged.
				// If all points touch edges, but not all edges do the same, we're completely fine with it.

				// So we're gonna check if all points of a small polygon are inside a big one, but none of the points
				// touches a point of a big polygon.

				let shouldMerge = true;
				for (let p1 of poly1) {
					shouldMerge = shouldMerge && MathTools.isPointInPolygon(p1, poly2);

					if (!shouldMerge)
						break;

					for (let p2 of poly2) {
						shouldMerge = shouldMerge && !MathTools.arePointsEqual(p1, p2);

						if (!shouldMerge)
							break;
					}

					if (!shouldMerge)
						break;
				}

				if (shouldMerge) {
					toMerge = {poly1, poly2};
					break;
				}

				// Check if any two edges of the polygons overlap, in which case we should merge polygons

				for (let ii = 0; ii < poly1.length - 1; ii++) {
					let edge1 = [poly1[ii], poly1[ii + 1]];

					for (let jj = 0; jj < poly2.length - 1; jj++) {
						let edge2 = [poly2[jj], poly2[jj + 1]],
							intersection = MathTools.linesIntersection(edge1, edge2);

						if (!intersection || intersection.length === 1)
							continue;

						let [p1, p2] = intersection, pairs = [[p1, p2], [p2, p1]];

						// When edges are adjacent, i.e. when only one point of the first edge touches a point
						// of the second edge
						if (MathTools.arePointsEqual(p1, p2))
							continue;

						for (let pair of pairs) {
							let [p1, p2] = pair;
							if (MathTools.isPointOnLine(p1, edge1) && MathTools.isPointOnLine(p2, edge2)) {
								toMerge = {poly1, poly2};
								break;
							}
						}

						if (toMerge)
							break;
					}
					if (toMerge)
						break;
				}
				if (toMerge)
					break;
			}
			if (toMerge)
				break;
		}
		if (!toMerge)
			break;

		let merged = polybool.union(
			{regions: [toMerge.poly1]},
			{regions: [toMerge.poly2]}
			).regions,
			newPolygon = merged.length === 1 ? merged[0] : merged[1];
		newPolygon.zoneNumber = toMerge.poly1.zoneNumber;

		// Union returns polygon with four points, we need to close it
		if (!MathTools.arePointsEqual(newPolygon[0], newPolygon[newPolygon.length - 1]))
			newPolygon.push(newPolygon[0]);

		let newPolygons = [newPolygon]; // Array with merged polygons

		for (let poly of this.mergedPolygons) {
			if (poly !== toMerge.poly1 && poly !== toMerge.poly2)
				newPolygons.push(poly);
		}
		this.mergedPolygons = newPolygons;
	}
}