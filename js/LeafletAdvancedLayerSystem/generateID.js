/**
 * A small function that generates random and unique ID
 * @return {string} Generated ID
 */
module.exports = function generateID () {
	return "_" + Math.random() + "_" + Date.now();
}