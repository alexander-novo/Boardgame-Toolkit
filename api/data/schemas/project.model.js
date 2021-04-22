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
			tagName: {type: String, required: false},
			//maybe just have data and be of any type
			dataString: {type: String, required: false},
			dataNumber: {type: Number, required: false},
		}],*/
		assetCollection: { type: Number, required: false },
	}],
	projectTags:[{
		name: {type: String, required: true},
		dataString: {type: String, required: false},
		dataNumber: {type: Number, required: false},
		assets: [{type: Number, required: false}],
		//collections: {[type: Number, required: false]}, do after assets
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
	}],
	camera: {
		x: { type: Number, required: true, default: 0 },
		y: { type: Number, required: true, default: 0 },
		zoom: { type: Number, required: true, default: 1 },
	},
});

module.exports = model("Project", ProjectScheme);