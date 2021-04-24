const chalk = require("chalk");
const fs = require("fs");
const skipFiles = ["runTests.js", "BaseTest.js"];

fs.readdirSync(__dirname, { withFileTypes: true }).forEach(file => {
	if (!file.isFile() || skipFiles.includes(file.name))
		return;
	let test;
	try { test = require(__dirname + "/" + file.name) }
	catch (e) {
		console.log("Can't import test, following exception occurred:");
		console.log(e);
		return;
	}

	let divider = "\n";
	for (let i = 0; i < test.testName.length; i++)
		divider += "-";

	console.log(chalk.rgb(
		50, 0, 50).bold(divider + "\n" + test.testName + divider
		));

	try { test.test(); }
	catch (e) {
		console.log("Can't run test " + test.testName + " because following error occurred:");
		console.log(e);
	}
});