/**
 * Does calculations without floating point error and with 5-digits precision after the point
 */
class MathTools {
	static precision = 0.00001;

	static isEqual(n1, n2) {
		return Math.abs(n1 - n2) <= this.precision;
	}

	static isLessThanOrEqualTo(n1, n2) {
		return n1 - n2 <= this.precision;
	}

	static isGreaterThanOrEqualTo(n1, n2) {
		return n1 - n2 >= -this.precision;
	}

	/**
	 * Determines if given point is lying on the given line.
	 * @param point {Array} - point in format [lng, lat]
	 * @param line {Array} - line in format [[lng, lat], [lng, lat]]
	 * @return {boolean} true, if does. False otherwise.
	 */
	static isPointOnLine(point, line) {
		let p1 = line[0], p2 = line[1];
		let p1x = p1[0], p1y = p1[1], p2x = p2[0], p2y = p2[1], px = point[0], py = point[1];

		// Determine if px and py is between line's points. If not, the point is not on the line.
		let minX = Math.min(p1x, p2x);
		let maxX = Math.max(p1x, p2x);
		let minY = Math.min(p1y, p2y);
		let maxY = Math.max(p1y, p2y);
		if (!(
			this.isGreaterThanOrEqualTo(py, minY) &&
			this.isLessThanOrEqualTo(py, maxY) &&
			this.isGreaterThanOrEqualTo(px, minX) &&
			this.isLessThanOrEqualTo(px, maxX)
		))
			return false;

		let params = this.getSlopeAndIntercept(line);
		// If deltaX is 0, we have a vertical line. We can't get an equation, but we can compare X coordinates
		if (params === undefined)
			return this.isEqual(p1x, px);

		return this.isEqual((params.slope * px + params.intercept), py);
	}

	/**
	 * Calculates slope and intercept for the given line
	 * @param line - line in format [[lng, lat], [lng, lat]]
	 * @return {{intercept: number, slope: number}|undefined} Object containing slope and intercept or undefined, if it can't be found (when dx = 0);
	 */
	static getSlopeAndIntercept(line) {
		let p1 = line[0], p2 = line[1];
		let p1x = p1[0], p1y = p1[1], p2x = p2[0], p2y = p2[1];
		let deltaX = p2x - p1x;
		if (this.isEqual(deltaX, 0))
			return undefined;

		let m = (p2y - p1y) / deltaX; // Slope
		let b = p1y - m * p1x; // Intercept
		return {
			slope: m,
			intercept: b
		};
	}

	/**
	 * Determines if points of the given line are lying on the edges of the given polygon.
	 * @param line {Array} - line in format [[lng, lat], [lng, lat]]
	 * @param polygon {Array} - polygon in format [[lng, lat], [lng, lat], ...]
	 * @return {boolean} true, if does. False otherwise.
	 */
	static isLineOnEdgeOfPolygon(line, polygon) {
		if (line.length !== 2)
			return false;
		let areBothPointsOnEdges = true;
		for (let point of line) {
			let isOnLine = false;
			for (let i = 0; i < polygon.length - 1; i++) {
				let edge = [polygon[i], polygon[i + 1]];
				if (this.isPointOnLine(point, edge)) {
					isOnLine = true;
					break;
				}
			}
			areBothPointsOnEdges = areBothPointsOnEdges && isOnLine;
		}
		return areBothPointsOnEdges;
	}

	/**
	 * Clips line using polygon.
	 * @param line {number[][]} - line in format [[lng, lat], [lng, lat]]
	 * @param polygon {number[][]} - polygon in format [[lng, lat], [lng, lat], ...]
	 * @return {*[]|undefined} Clipped line where points are sorted from left to right or, if x coordinates are equal, from top to bottom. Or undefined if line doesn't intersect the polygon.
	 */
	static clipLineByPolygon(line, polygon) {
		if (line.length !== 2)
			return undefined;

		// Find intersection of each edge with the line and put it to the array
		let intersections = [];
		for (let i = 0; i < polygon.length - 1; i++) {
			let edge = [polygon[i], polygon[i + 1]];
			let intersection = this.linesIntersection(line, edge);
			if (intersection === undefined)
				continue;

			for (let point of intersection)
				intersections.push(point);
		}

		// Find two points that will produce greatest length. It will yield the segment inside the whole polygon.
		let point1, point2, previousLength;
		for (let i = 0; i < intersections.length; i++) {
			for (let j = i + 1; j < intersections.length; j++) {
				let p1 = intersections[i], p2 = intersections[j];
				let length = this.distanceBetweenPoints(p1, p2);
				if (previousLength !== undefined && this.isLessThanOrEqualTo(length, previousLength))
					continue;
				point1 = p1;
				point2 = p2;
				previousLength = length;
			}
		}
		if (previousLength === undefined)
			return undefined;

		// Sort points from left to right and, if x coordinates are equal, from top to bottom.
		let x1 = point1[0], x2 = point2[0], y1 = point1[1], y2 = point2[1];
		if (this.isEqual(x1, x2)) {
			if (this.isGreaterThanOrEqualTo(y1, y2))
				return [point1, point2];
			return [point2, point1];
		} else if (this.isLessThanOrEqualTo(x1, x2))
			return [point1, point2];
		return [point2, point1];
	}

	/**
	 * Calculate y coordinate for given x, so the [x, y] point is the point lying on the given line.
	 * @param line - line in format [[lng, lat], [lng, lat]]
	 * @param x {number} X coordinate
	 * @return {number|undefined} Y coordinate or undefined, if line slope and intercept can't be found for the given line
	 */
	static yForX(line, x) {
		let params = this.getSlopeAndIntercept(line);
		if (params === undefined)
			return undefined;
		return (params.slope * x + params.intercept);
	}

	/**
	 * Calculates intersection of given lines. If lines are coincident, will return array of intersecting endpoints of the lines.
	 * @param line1 - line in format [[lng, lat], [lng, lat]]
	 * @param line2 - line in same format
	 * @return {*[]|undefined} One of: Array of intersections or, if lines doesn't intersect, undefined
	 */
	static linesIntersection(line1, line2) {
		/*
		// Stuff for other algorithm, not needed now. TODO: Remove it if there will be no bugs found.
		let y1 = p11[1], x2 = p12[0], y2 = p12[1], y3 = p21[1], x4 = p22[0], y4 = p22[1];
		let p12 = line1[0],  p22 = line2[1];
		 */
		let p11 = line1[0], p21 = line2[0];
		let x1 = p11[0], x3 = p21[0];

		let params1 = this.getSlopeAndIntercept(line1);
		let params2 = this.getSlopeAndIntercept(line2);

		// Case when only one of the lines is vertical
		let x, verticalLine, otherLine;
		let shouldIterateOverPoints = false; // In case of parallel and overlapping lines we should use another method of detection intersections
		if (params1 === undefined && params2 !== undefined) {
			x = x1;
			verticalLine = line1;
			otherLine = line2;
		} else if (params2 === undefined && params1 !== undefined) {
			x = x3;
			verticalLine = line2;
			otherLine = line1;
		} else if (params1 === undefined && params2 === undefined)
			shouldIterateOverPoints = true;

		// If one of the lines is vertical
		if (otherLine !== undefined) {
			let point = [x, this.yForX(otherLine, x)];
			if (this.isPointOnLine(point, otherLine) && this.isPointOnLine(point, verticalLine))
				return [point];
			return undefined;
		}

		if (!shouldIterateOverPoints) {
			let slopeDiff = params1.slope - params2.slope;
			let interceptDiff = params2.intercept - params1.intercept;

			 // Case when lines are parallel...
			if (this.isEqual(slopeDiff, 0)) {
				if (!this.isEqual(interceptDiff, 0)) // ... and don't overlap
					return undefined;
				shouldIterateOverPoints = true; // ... and do overlap
			}

			// A normal case where lines are not vertical or parallel
			if (!shouldIterateOverPoints) {
				let x = interceptDiff / slopeDiff;
				let point = [x, this.yForX(line1, x)];
				if (this.isPointOnLine(point, line1) && this.isPointOnLine(point, line2))
					return [point];
				return undefined;
			}
		}

		let points = [];
		for (let point of line1) {
			if (this.isPointOnLine(point, line2))
				points.push(point);
		}
		for (let point of line2) {
			if (this.isPointOnLine(point, line1))
				points.push(point);
		}

		if (points.length !== 0)
			return points;
		return undefined;
	}

	static distanceBetweenPoints(p1, p2) {
		let dx = p1[0] - p2[0];
		let dy = p1[1] - p2[1];
		return Math.sqrt(dx ** 2 + dy ** 2);
	}

	static arePointsEqual(p1, p2) {
		return this.isEqual(p1[0], p2[0]) && this.isEqual(p1[1], p2[1]);
	}

}

module.exports = MathTools;