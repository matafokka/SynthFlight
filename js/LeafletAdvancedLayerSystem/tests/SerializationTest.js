require('jsdom-global')(`
<html><body>
	<div id="map"></div>
</html></body>
`, {resources: "usable", runScripts: "outside-only"});
delete window.localStorage; // L.ALS.Helpers access localStorage which breaks JSDOM. Removing localStorage from window works. Helpers polyfills it anyway.

L = require("leaflet");
require("../System.js");

/**
 * Simple control object for the testing
 */
L.ALS.ControlObject = L.ALS.Serializable.extend({

	someField: "Field",

	initialize: function () {
		L.ALS.Serializable.prototype.initialize.call(this);
		this.setConstructorArguments([]);
	},

	control: function () {
		console.log("Ha!");
	}
});

let map = L.map("map", {preferCanvas: true}).setView([51.505, -0.09], 13);

L.ALS.System.initializeSystem();

const BaseTest = require("./BaseTest.js");

/**
 * Tests serialization
 */
class SerializationTest extends BaseTest {

	static testName = "Serialization";

	static test() {
		let a = new L.ALS.Serializable();
		a.a = a;
		let b = {a: a};
		b.b = b;
		a.b = b;
		let c = {number: 12}
		c.c = c;
		a.c = c;
		a.testValues = {
			inf: Infinity,
			mInf: -Infinity,
			null: null,
			nan: NaN,
			regexp: /a*b/,
			symbol: Symbol("My symbol"),
			bigInt: BigInt("45652615781231478123765"),
			emptyArray: [],
			otherArray: ["hey"],
			array: [a, b, c, "string", 123, Infinity, -Infinity, null, NaN, /a/],
		}
		a.testValues.regexp.customValue = "custom value";
		a.testValues.array.push(a.testValues.array, a.testValues.otherArray);
		a.testValues.array.customProperty = "custom property";
		a.testValues.otherArray.push(a.testValues.array);

		let anotherSerializable = new L.ALS.Serializable();
		anotherSerializable.firstSerializable = a;
		a.anotherSerializable = anotherSerializable;

		this.logSection("Multiple serializations");
		let testObj;
		let seenObjects = {};
		for (let i = 0; i < 10; i++) {
			let serialized = a.serialize(seenObjects);
			//console.log("Serialized:", serialized);
			L.ALS.Serializable.cleanUp(seenObjects);
			testObj = L.ALS.Serializable.deserialize(serialized, seenObjects);
			//console.log("Deserialized:", testObj);
			L.ALS.Serializable.cleanUp(seenObjects);
		}

		this.logResult("Object has been successfully serialized and deserialized back multiple times", true);

		this.logSection("Properties");

		this.logResult("Property a is cyclic and same", (testObj.a.a === testObj.a.a.a));
		this.logResult("Property b is cyclic and same", (testObj.b.b === testObj.b.b.b));
		this.logResult("Property b contains property a and both properties are cyclic and same",
			(testObj.b.a === testObj.a && testObj.b.b.a === testObj.a.a.a));
		this.logResult("Property c is cyclic and same", (testObj.c.c === testObj.c.c.c));
		this.logSection("Values unsupported by JSON.parse()");
		this.logResult("+Infinity", (a.testValues.inf === Infinity));
		this.logResult("-Infinity", (a.testValues.mInf === -Infinity));
		this.logResult("null", a.testValues.null === null);
		this.logResult("NaN", isNaN(a.testValues.nan));
		this.logResult("Symbol", (a.testValues.symbol.toString() === "Symbol(My symbol)"));
		this.logResult("BigInt", (typeof a.testValues.bigInt === "bigint" && a.testValues.bigInt.toString() === "45652615781231478123765"));
		this.logResult("RegExp", (a.testValues.regexp.toString() === /a*b/.toString()));
		this.logResult("Custom RegExp properties", (a.testValues.regexp.customValue === "custom value"));
		this.logResult("Empty array", (a.testValues.emptyArray instanceof Array && a.testValues.emptyArray.length === 0));
		this.logResult("Custom array property", (a.testValues.array.customProperty === "custom property"));

		this.logSection("Complex arrays");

		this.logResult("\"a\" element", (a.testValues.array[0] === a));
		this.logResult("\"b\" element", (a.testValues.array[1] === b));
		this.logResult("\"c\" element", (a.testValues.array[2] === c));
		this.logResult("String element", (a.testValues.array[3] === "string"));
		this.logResult("Number element", (a.testValues.array[4] === 123));
		this.logResult("Infinity element", (a.testValues.array[5] === Infinity));
		this.logResult("-Infinity element", (a.testValues.array[6] === -Infinity));
		this.logResult("null element", (a.testValues.array[7] === null));
		this.logResult("NaN element", isNaN(a.testValues.array[8]));
		this.logResult("RegExp element", (a.testValues.array[9].toString() === /a/.toString()));
		this.logResult("Cyclic reference to the same array", (a.testValues.array[10] === a.testValues.array));
		this.logResult("Reference to the other array which references the original array",
			(a.testValues.array[11] === a.testValues.otherArray && a.testValues.array[11][1] === a.testValues.array)
		);

		this.logSection("Widgetable");

		let controlObj = new L.ALS.ControlObject();
		let widgetable = new L.ALS.Widgetable("my-class");
		let w = new L.ALS.Widgets.Number("id", "label", controlObj, "control");
		widgetable.addWidget(w);
		w.setValue(2);

		seenObjects = {};
		let serializedWidgetable = widgetable.serialize(seenObjects);
		L.ALS.Serializable.cleanUp(seenObjects);
		seenObjects = {};
		let deserializedWidgetable = L.ALS.Widgetable.deserialize(serializedWidgetable, seenObjects);
		L.ALS.Serializable.cleanUp(seenObjects);

		this.logResult("Widgetable type is correct", (deserializedWidgetable instanceof L.ALS.Widgetable));
		let restoredWidget = deserializedWidgetable.getWidgetById("id");
		this.logResult("Has widget", (restoredWidget !== undefined));
		this.logResult("Widget type is correct", (restoredWidget instanceof L.ALS.Widgets.Number));
		this.logResult("Widget value is correct", (restoredWidget.getValue() === 2));
	}

}

module.exports = SerializationTest;