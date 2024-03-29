const mongoose = require('mongoose');
const User = mongoose.model('User')
const axios = require('axios').default;
const { GEN_JWT } = require('../jwt');
const captchaSecret = process.env.RECAPTCHA_SECRET;

if (!captchaSecret) {
	console.error("Google ReCaptcha secret not found. Please add to RECAPTCHA_SECRET environment variable (through .env file and heroku local command on local machines).");
	process.exit(1);
}

// Unique user endpoint
// Take username and email.
// Respond with whether or not those are already in the database.
module.exports.uniqueUser = async (req, res) => {
	try {
		// Check if the username or email is in the database
		// TODO: This could probably be done with one query instead of 2 separate ones?
		let userUnique = !await User.exists({ username: req.query.user });
		let emailUnique = !await User.exists({ email: req.query.email });

		// Respond with uniqueness
		res.status(200).json({ emailUnique, userUnique });
	}
	catch (err) {
		res.status(500).json(err);
	}
};

// Register endpoint
// Take new account info (username, password, email, name, etc.).
// Generate new account, then sign in.
// TODO: Google Captcha?
module.exports.registerUser = async (req, res) => {
	// TODO: input validation

	if (!req.body || !req.body.captcha) {
		res.status(500).json({ error: "Please fill out a captcha." });
		return;
	}

	// Validate ReCaptcha
	var captchaResponse = await axios.post(
		`https://www.google.com/recaptcha/api/siteverify?secret=${captchaSecret}&response=${req.body.captcha}&remoteip=${req.ip}`
	);

	if (captchaResponse.status != 200) {
		res.status(500).json({ error: "There was a problem with ReCaptcha." });
		return;
	} else if (!captchaResponse.data.success) {
		res.status(401).json({ error: "ReCaptcha validation failed." });
		return;
	}

	// Create new user with account info
	var user = new User(req.body);
	try {
		// Attempt to save user in database.
		// Validators will check to see if the user is valid - if not, throw error.
		await user.save();

		// If user was valid, sign them in by creating a jwt auth token.
		// Should match token generated in /api/login.
		// TODO: take token generation out of both of these endpoints and make separate token generation function
		const token = GEN_JWT(user);

		// Send token as cookie and in response
		res.cookie('jwt', token);
		res.status(201).json({ token });
	} catch (err) {
		// TODO: check the error and see if it is an input error. If so, respond to client with instructions on how to fix
		console.log(err);
		res.status(500).json(err);
	}
};