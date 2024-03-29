const { Schema, model } = require("mongoose");
const bcrypt = require("bcrypt");
const { isEmail } = require('validator');

const SALT_WORK_FACTOR = 10;

const UserSchema = new Schema({
	name: { type: String, required: true },
	username: { type: String, required: true, index: { unique: true } },
	password: { type: String, required: true },
	email: {
		type: String,
		required: true,
		validate: [isEmail, 'invalid email'],
		createIndexes: { unique: true },
	},
	date: {
		creation: { type: Date, required: true, default: Date.now },
		birth: { type: Date, required: false },
	},
	projects: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
});

// Hash password entries
UserSchema.pre("save", async function (next) {
	// Don't hash if the password field hasn't been modified
	if (!this.isModified('password')) return next();

	try {
		const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
		this.password = await bcrypt.hash(this.password, salt);
	} catch (err) {
		return next(err);
	}

	return next();
});

UserSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
	// Compare passwords
	return bcrypt.compare(candidatePassword, this.password);
};

module.exports = model("User", UserSchema);