const fs = require("fs");
const skipFiles = ["runTests.js", "BaseTest.js"];

fs.readdirSync(__dirname, { withFileTypes: true }).forEach(file => {
	if (!file.isFile() || skipFiles.includes(file.name))
		return;
	let test;
	try { test = require(__dirname + "/" + file.name) }
	catch (e) { console.log(e); return; }

	let divider = "\n";
	for (let i = 0; i <= file.name.length; i++)
		divider += "-";
	console.log(divider + "\n" + test.testName + divider);
	test.test();
});