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
	}]
});

module.exports = model("Project", ProjectScheme);