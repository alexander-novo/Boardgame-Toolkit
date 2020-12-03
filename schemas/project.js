const { Schema, model } = require("mongoose");
const bcrypt = require("bcrypt");
const { isEmail } = require('validator');

const SALT_WORK_FACTOR = 10;

const ProjectScheme = new Schema({
	name: { type: String, required: true },
	owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	date: {
		created: { type: Date, required: true, default: Date.now },
		modified: { type: Date, required: true, default: Date.now },
	},
});

module.exports = model("Project", ProjectScheme);