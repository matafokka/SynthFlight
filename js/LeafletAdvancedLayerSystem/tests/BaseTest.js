const chalk = require("chalk");

/**
 * Base class for tests. All members are static.
 *
 * Override field `name` and set it to your test's name
 *
 * Override {@link BaseTest.test} method and implement your tests here.
 *
 * Use {@link BaseTest.logResult} to log your tests' results.
 *
 * Use {@link BaseTest.logSection} to output tests sections.
 *
 * To mock DOM, use `jsdom-global` instead of just `jsdom`.
 */
class BaseTest {

	/**
	 * Name of your test
	 * @type {string}
	 */
	static testName = "Unknown test";

	/**
	 * Put your tests here
	 */
	static test() {}

	/**
	 * Logs test's result
	 * @param testName {string} Name of the test to display
	 * @param result {boolean} Test result
	 */
	static logResult(testName, result) {
		let color, text;
		if (result) {
			color = chalk.green;
			text = "✓";
		} else {
			color = chalk.bold.red;
			text = "✗";
		}
		console.log(color(text + " " + testName));
	}

	/**
	 * Outputs section name to the console
	 * @param name {string} name of the section
	 */
	static logSection(name) {
		console.log(chalk.blueBright("\n--- " + name + " ---\n"));
	}

	// TODO: Make it work, clean up custom global vars correctly.
	static _cleanUpJSDOMGlobal(cleanUpFn, ...customGlobalVars) {
		window.close();
		for (let v of customGlobalVars)
			delete global[v];
		cleanUpFn();
	}

}

module.exports = BaseTest;