/**
 *
 * # Introduction
 *
 * Provides serialization capabilities, used to serialize different kinds of objects to JSON and deserialize them back.
 *
 * Deals with cyclic references.
 *
 * Serializes following types: Array, RegExp, BigInt, Symbol. Serializes custom properties in all of those types.
 *
 * Tries to deal with any types of objects, but you may want to provide your own serialization and deserialization mechanisms. To do so, override serialize() and static deserialize() methods.
 *
 * **Caveat.** Objects' ownership (where object has been created) changes after deserialization. The way it changes depends on how user's browser handles `for ... in` loop. The first place object will appear at would be the owner of that object after deserialization.
 *
 * # How to implement custom mechanisms
 *
 * You'll have to override `serialize()` and `deserialize()` methods.
 *
 * `serialize()` should return an object that can be serialized by `JSON.stringify()`. You may want to create plain objects containing your data or use static `serializeAnyObject()` method to serialize complex objects. Though, `serializeAnyObject()` won't work with custom classes it may be still useful.
 *
 * Static `deserialize()` method accepts your serialized object as an argument and must return a deserialized instance of your class. You can use static `getObjectFromSerialized()` method to do so and perform your deserialization on returned object. You may also find default deserialization mechanism useful for deserializing complex objects such as described above.
 *
 * There are also plenty of helpers methods to accomplish your goal.
 *
 * # Hints
 *
 * Every `Serializable` instance has public `serializationIgnoreList` property which contains properties' names to ignore while serializing. You may want to use it if you want to stick to default serialization mechanisms. Just append your properties' and methods' names to `serializationIgnoreList`.
 *
 * Both `serialize()` and `deserialize()` methods accepts two additional arguments: `seenObjects` and `seenObjectsForCleanUp`. Those are used internally by serialization mechanism. If you're making layer, just don't pass anything to the default mechanism. If your class serializes some other Serializable that uses default mechanism, please, pass those parameters to it's `serialize()` and `deserialize()` methods.
 *
 * You can prevent constructor arguments from being serialized or deserialized by creating custom `skipSerialization` and `skipDeserialization` properties respectively and setting them to `true`. If you choose to prevent serialization, you'll need to set skipped arguments at deserialization yourself. For this, see the next tip.
 *
 * You can put custom objects as arguments to the constructor while deserializing using default mechanisms. To do so:
 * 1. Assign `serialized.constructorArguments` to the array.
 * 1. For each custom object argument: create `skipDeserialization` property and set it to `true`.
 * 1. Put your custom arguments to `serialized.constructorArguments` in such order that constructor requires.
 * 1. Pass your `serialized` object to the default mechanism: `L.ALS.Serializable.deserialize(serialized);`
 *
 * @type {L.ALS.Serializable}
 */
L.ALS.Serializable = L.Class.extend({

	initialize: function () {

		/**
		 * Contains properties that won't be serialized. Append your properties at constructor.
		 * @type {string[]}
		 */
		this.serializationIgnoreList = ["serializationIgnoreList", "__proto__", "prototype", "_initHooks", "_initHooksCalled", "setConstructorArguments", "constructorArguments", "includes", "_leaflet_id", "_map", "_mapToAdd", "_events", "_eventParents", "getPane"];

	},

	/**
	 * Sets constructor arguments for serialization
	 * @param args
	 */
	setConstructorArguments: function (args) {
		if (!args)
			args = [];
		this.constructorArguments = Array.prototype.slice.call(args);
	},

	/**
	 * Serializes this object to JSON. If overridden, you MUST perform following operations before returning JSON:
	 *
	 * ```JS
	 * let json = {} // Your JSON
	 * ... // Perform serialization
	 * json.constructorArguments = this.serializeConstrutorArguments(); // Serialize constructor arguments
	 * json.serializableClassName = this.serializableClassName; // Add class name to JSON
	 * return json; // Finally return JSON
	 * ```
	 *
	 * @return {{}} This serialized object
	 */
	serialize: function (seenObjects) {
		let serialized = L.ALS.Serializable.serializeAnyObject(this, seenObjects);
		serialized.constructorArguments = this.serializeConstructorArguments(seenObjects);
		return serialized;
	},

	/**
	 * Serializes constructor arguments. If your constructor is not empty, result of this method MUST be added to json at serialize() as "_construtorArgs" property.
	 * @return {*[]} Serialized constructor arguments
	 */
	serializeConstructorArguments: function (seenObjects) {
		let constructorArgs = [];
		if (this.constructorArguments) {
			for (let arg of this.constructorArguments) {
				if (!arg.skipSerialization)
					constructorArgs.push(L.ALS.Serializable.serializeAnyObject({a: arg}, seenObjects).a);
			}
		}
		return constructorArgs;
	},

	statics: {

		/**
		 * Prefix added when serializing unsupported types such as NaN or Infinity
		 */
		unsupportedTypesPrefix: "alsSerializable__",

		/**
		 * Prefix added to BigInts when serializing
		 */
		bigIntPrefix: "BigInt__",

		/**
		 * Prefix added to Symbols when serializing
		 */
		symbolPrefix: "Sym__",

		/**
		 * List of custom properties to ignore when deserializing arrays
		 */
		arrayIgnoreList: ["_alsSerializableArray", "serializationID"],

		/**
		 * Checks if property should be ignored when serializing or deserializing
		 * @param property {string} Name of the property
		 * @param objectWithIgnoreLists {L.ALS.Serializable|Object} Object containing ignore lists
		 * @param isGetter {boolean} Indicates whether given property is getter or not
		 * @return {boolean} True, if property is in ignore lists. False otherwise.
		 */
		shouldIgnoreProperty: function (property, objectWithIgnoreLists, isGetter = false) {
			let obj = objectWithIgnoreLists[property];
			if (obj === undefined || obj === null || obj instanceof Element || (typeof obj === "function" && !isGetter))
				return true;

			if (objectWithIgnoreLists.serializationIgnoreList)
				return objectWithIgnoreLists.serializationIgnoreList.indexOf(property) !== -1;
			return false;
		},

		/**
		 * Cleans up seen objects. Must be called after first call of `serialize()`, `serializeAnyObjects()` or `deserialize()`. Should not be called in the middle of serialization or deserialization, for example, at `serialize()`.
		 * @param seenObjects {Object} `seenObjects` argument that you've passed to serialization and deserialization methods
		 * @public
		 */
		cleanUp: function (seenObjects) {
			for (let prop in seenObjects) {
				let object = seenObjects[prop];
				delete object.propertiesOrder;
				delete object.serializationID;
			}
		},

		/**
		 * Serializes primitives including types unsupported by JSON
		 * @param primitive Primitive to serialize
		 * @return Serialized primitive
		 */
		serializePrimitive: function (primitive) {
			let part = "";
			if (BigInt && typeof primitive === "bigint")
				part = L.ALS.Serializable.bigIntPrefix + primitive.toString();
			else if (Symbol && typeof primitive === "symbol") {
				let s = primitive.toString();
				part = L.ALS.Serializable.symbolPrefix + [s.slice(7, s.length - 1)] // Symbol.toString() returns "Symbol(your_string)". So we slice it to get "your_string"
			}
			else if (typeof primitive !== "number")
				return primitive;
			else if (isNaN(primitive))
				part = "NaN";
			else if (primitive === Infinity)
				part = "INF";
			else if (primitive === -Infinity)
				part = "-INF";
			else
				return primitive;
			return L.ALS.Serializable.unsupportedTypesPrefix + part;
		},

		deserializePrimitive: function (primitive) {
			if (typeof primitive !== "string" || !primitive.startsWith(L.ALS.Serializable.unsupportedTypesPrefix))
				return primitive;

			let val = primitive.slice(L.ALS.Serializable.unsupportedTypesPrefix.length, primitive.length);

			let types = [{prefix: L.ALS.Serializable.bigIntPrefix, type: BigInt}, {prefix: L.ALS.Serializable.symbolPrefix, type: Symbol}];
			for (let type of types) {
				if (val.startsWith(type.prefix))
					return type.type(val.slice(type.prefix.length, val.length));
			}

			switch (val) {
				case "NaN": { return NaN; }
				case "INF": { return Infinity; }
				case "-INF": { return -Infinity; }
			}
		},

		/**
		 * Finds a constructor by given class name
		 * @param className {string} Full class name. Just pass serialized.serializableClassName.
		 * @return {function|undefined} Found constructor or undefined
		 */
		getSerializableConstructor: function (className) {
			className += ".";
			let namespace = window;
			let currentPart = "";
			for (let symbol of className) {
				if (symbol === ".") {
					namespace = namespace[currentPart];
					currentPart = "";
				} else
					currentPart += symbol;
			}
			return namespace;
		},

		/**
		 * Constructs new instance of Serializable and passes serialized arguments to the constructor. Assigns `serializationID` to the object and adds it to `seenObjects`.
		 * @param serialized {Object} Serialized Serializable object
		 * @param seenObjects Already seen objects' ids. Intended only for internal use.
		 * @return {L.ALS.Serializable|Object} Instance of given object or `serialized` argument if constructor hasn't been found
		 */
		getObjectFromSerialized: function (serialized, seenObjects) {
			let constructor = L.ALS.Serializable.getSerializableConstructor(serialized.serializableClassName);

			if (!serialized.serializationID)
				serialized.serializationID = L.ALS.Helpers.generateID();

			if (constructor === undefined) {
				seenObjects[serialized.serializationID] = serialized;
				return serialized;
			}

			if (!(serialized.constructorArguments instanceof Array) || serialized.constructorArguments.length === 0)
				serialized.constructorArguments = [];

			let constructorArgs = [];
			for (let arg of serialized.constructorArguments) {
				if (arg && arg.skipDeserialization)
					constructorArgs.push(arg);
				else
					constructorArgs.push(L.ALS.Serializable.deserialize({a: arg}, seenObjects).a);
			}
			let object = new constructor(...constructorArgs);

			object.serializationID = serialized.serializationID;
			seenObjects[serialized.serializationID] = object;

			return object;
		},

		/**
		 * Finds getter or setter name for given property in a given object
		 * @param isGetter {boolean} If set to true, will find getter. Otherwise will find setter
		 * @param property {string} Property name
		 * @param object {Object} Object to find getter or setter in
		 * @return {string|undefined} Either getter or setter name or undefined if nothing has been found
		 * @protected
		 */
		_findGetterOrSetter: function (isGetter, property, object) {
			let index = (property[0] === "_") ? 1 : 0;
			let func1 = (isGetter ? "get" : "set") + property[index].toUpperCase() + property.slice(index + 1);
			let func2 = "_" + func1;
			let funcs = [func1, func2];
			for (let func of funcs) {
				if (object[func] && typeof object[func] === "function")
					return func;
			}
			return undefined;
		},

		/**
		 * Finds getter name for given property in a given object
		 * @param property {string} Property name
		 * @param object {Object} Object to find getter in
		 * @return {string|undefined} Either getter name or undefined if nothing has been found
		 */
		findGetter: function (property, object) {
			return L.ALS.Serializable._findGetterOrSetter(true, property, object);
		},

		/**
		 * Finds setter name for given property in a given object
		 * @param property {string} Property name
		 * @param object {Object} Object to find setter in
		 * @return {string|undefined} Either setter name or undefined if nothing has been found
		 */
		findSetter: function (property, object) {
			return L.ALS.Serializable._findGetterOrSetter(false, property, object);
		},

		/**
		 * Generic serialization mechanism. Tries to serialize everything possible
		 * @param object Any object or primitive to serialize
		 * @param seenObjects Already seen objects' ids. Intended only for internal use.
		 * @return Serialized object or primitive
		 */
		serializeAnyObject: function (object, seenObjects) {
			if (!(object instanceof Object))
				return L.ALS.Serializable.serializePrimitive(object);

			if (!object.serializationID)
				object.serializationID = L.ALS.Helpers.generateID();
			seenObjects[object.serializationID] = object;
			let serialize = function (object) {
				let json = { propertiesOrder: [] }; // Gotta keep properties' order
				let seenProps = [];
				for (let prop in object) {
					// Check if property is getter
					let isGetter = (typeof object[prop] === "function" && prop.startsWith("get") && prop[3] === prop[3].toUpperCase());

					if (seenProps.includes(prop) || (!object.hasOwnProperty(prop) && !isGetter) || L.ALS.Serializable.shouldIgnoreProperty(prop, object, isGetter))
						continue;

					let propName = prop; // Property name to write into JSON
					if (isGetter && object[prop].length === 0) {
						let name1 = prop[3].toLowerCase() + prop.slice(4, prop.length);
						let name2 = "_" + name1;
						for (let name of [prop, name1, name2]) {
							if (object[name])
								propName = name;
						}

						if (propName === prop) // If name is equal to getter, replace it with one of the names so we can deserialize it later
							propName = name1;

						seenProps.push(prop, name1, name2);
					} else if (!isGetter)
						seenProps.push(propName);
					else
						continue;

					//console.log(json);
					json.propertiesOrder.push(propName);
					let getter = isGetter ? prop : L.ALS.Serializable.findGetter(prop, object);
					let property = (getter === undefined) ? object[prop] : object[getter]();
					if (property instanceof Element)
						continue;

					if (!(property instanceof Object)) // Copy non-object properties
						json[propName] = L.ALS.Serializable.serializePrimitive(property);
					else if (property.serializationID && seenObjects[property.serializationID]) // Replace seen objects with references
						json[propName] = { serializationReference: property.serializationID };
					else if (property.serialize) // Serialize serializable objects
						json[propName] = property.serialize(seenObjects);
					else { // Deeply serialize everything else
						if (!property.serializationID) // Create id for an object
							property.serializationID = L.ALS.Helpers.generateID();
						seenObjects[property.serializationID] = property; // Add object to seen objects

						// Serialize arrays by copying all it's items to an object and serializing that object instead.
						// This is also needed because JSON.stringify() removes custom array properties.
						if (property instanceof Array) {
							let newProperty = {
								_alsSerializableArray: true,
								serializationID: property.serializationID
							};
							for (let i in property)
								newProperty[i] = property[i];
							json[propName] = serialize(newProperty);
						} else
							json[propName] = serialize(property); // Serialize object
					}
				}
				return json;
			}
			return serialize(object);
		},

		/**
		 * Generic deserialization method, can be used to deserialize any object or primitive anywhere by calling L.ALS.Serializable.deserialize().
		 * @param serialized {Object} Serialized object or primitive
		 * @param seenObjects Already seen objects' ids. Intended only for internal use.
		 * @return Deserialized object or primitive
		 */
		deserialize: function (serialized, seenObjects) {
			if (!(serialized instanceof Object))
				return L.ALS.Serializable.deserializePrimitive(serialized);

			let deserialize = (obj) => {
				let props = (obj.propertiesOrder === undefined) ? Object.keys(obj) : obj.propertiesOrder;
				for (let prop of props) {
					let property = obj[prop];
					if (prop === "_" || L.ALS.Serializable.shouldIgnoreProperty(prop, obj))
						continue;

					// Deserialize Serializable objects
					if (property.serializableClassName) {
						let constructor = this.getSerializableConstructor(property.serializableClassName);
						if (constructor.deserialize)
							property = constructor.deserialize(property, seenObjects);
						else {
							property = deserialize(property, seenObjects);
							seenObjects[property.serializationID] = property;
						}
					}
					// If current property is a reference, restore it
					else if (property.serializationReference && seenObjects[property.serializationReference] !== undefined)
						property = seenObjects[property.serializationReference];
					else if (property instanceof Object) { // Objects and arrays
						// Preparations for deserializing arrays
						let oldProperty = property;
						if (property._alsSerializableArray) {
							property = [];
							property.serializationID = oldProperty.serializationID;
						}

						// Objects in general
						if (!property.serializationID)
							property.serializationID = L.ALS.Helpers.generateID();
						seenObjects[property.serializationID] = property;

						if (oldProperty._alsSerializableArray) { // Arrays
							for (let i in oldProperty) {
								if (!L.ALS.Serializable.arrayIgnoreList.includes(i))
									property[i] = deserialize({item: oldProperty[i]}).item; // Keeps both items and custom properties while preserving array type
							}
						}
						 else {
							property = deserialize(property);
							seenObjects[property.serializationID] = property;
						}
					} else // Primitives
						property = L.ALS.Serializable.deserializePrimitive(property);

					let setter = L.ALS.Serializable.findSetter(prop, obj);
					if (setter === undefined)
						obj[prop] = property;
					else
						obj[setter](property);

				}
				return obj;
			}

			let object = this.getObjectFromSerialized(serialized, seenObjects);
			// Copy properties from serialized object to instance
			for (let prop in serialized)
				object[prop] = serialized[prop];

			return deserialize(object);
		},
	}
});

// Monkey-patch certain types to be serializable

// TODO: If won't patch other classes, move it directly to RegExp
let _types = [RegExp];
for (let type of _types) {
	if (type) {
		type.deserialize = function (serialized, seenObjects) {
			return L.ALS.Serializable.deserialize(serialized, seenObjects);
		}
	}
}

RegExp.prototype.serialize = function (seenObjects) {
	let json = L.ALS.Serializable.serializeAnyObject(this, seenObjects);
	json.serializableClassName = "RegExp";
	json.constructorArguments = [this.toString()];
	return json;
}

L.LatLng.prototype.serialize = function (seenObjects) {
	let serialized = {
		serializableClassName: "L.LatLng",
	};

	for (let prop in this) {
		if (this.hasOwnProperty(prop))
			serialized[prop] = L.ALS.Serializable.serializeAnyObject(this[prop], seenObjects);
	}
	return serialized;
}

L.LatLng.deserialize = function (serialized, seenObjects) {
	let latLng = L.latLng(serialized.lat, serialized.lng, serialized.alt);
	for (let prop in serialized)
		latLng[prop] = L.ALS.Serializable.deserialize(serialized[prop], seenObjects);
	return latLng;
}