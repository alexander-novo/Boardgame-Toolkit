const { analyzeAndValidateNgModules } = require("@angular/compiler");
const { stringify } = require("@angular/compiler/src/util");
const { Schema, model } = require("mongoose");

const ProjectScheme = new Schema({
	name: { type: String, required: true },
	owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	date: {
		created: { type: Date, required: true, default: Date.now },
		modified: { type: Date, required: true, default: Date.now },
	},
	thumbnail: { type: String, required: false },
	assets: [{
		name: { type: String, required: true },
		url: { type: String, required: true },
		size: { type: Number, required: true },
		position: {
			type: {
				x: { type: Number, required: true },
				y: { type: Number, required: true },
			},
			required: false,
		},
		scale: {
			type: {
				x: { type: Number, required: true },
				y: { type: Number, required: true },
			},
			required: false,
		},
		angle: {
			type: Number,
			required: true,
			default: 0,
		},
		/*tags: [{
			index: {type: Number, required: true},
			dataString: {type: String, required: false},
			dataNumber: {type: Number, required: false},
			dataBoolean: {type: Boolean, required: false},
		}],*/
		assetCollection: { type: Number, required: false },
		hiddenFromPlayers: { type: Boolean, required: true, default: false },
	}],
	projectTags:[{
		name: {type: String, required: true},
		//collections: {[type: Number, required: false]}, 
	}],

	assetCollections: [{
		name: { type: String, required: true },
		assets: [{ type: Number, required: true }],
		url: { type: String, required: false },
		position: {
			type: {
				x: { type: Number, required: true },
				y: { type: Number, required: true },
			},
			required: false,
		},
		scale: {
			type: {
				x: { type: Number, required: true },
				y: { type: Number, required: true },
			},
			required: false,
		},
		angle: {
			type: Number,
			required: true,
			default: 0,
		},
		hiddenFromPlayers: { type: Boolean, required: true, default: false },

		/*tags: [{
		index: {type: Number, required: true},
		dataString: {type: String, required: false},
		dataNumber: {type: Number, required: false},
		dataBoolean: {type: Boolean, required: false},
		}],*/
	}],
	camera: {
		x: { type: Number, required: true, default: 0 },
		y: { type: Number, required: true, default: 0 },
		zoom: { type: Number, required: true, default: 1 },
	},
});

module.exports = model("Project", ProjectScheme);