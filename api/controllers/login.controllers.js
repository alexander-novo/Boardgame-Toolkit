const mongoose = require('mongoose');
const User = mongoose.model('User')
const ejwt = require('express-jwt');
const { EJWT_OPTIONS, GEN_JWT } = require('../jwt');

module.exports.loginUser = async (req, res) => {
	var user;
	try {
		user = await User.findOne({ username: req.body.username });
	} catch (err) {
		res.status(500).json(err);
		return;
	}

	// Don't differentiate between incorrect password and user can't be found.
	if (!user || !await user.comparePassword(req.body.password)) {
		res.status(401).json("Access denied");
		return;
	}

	// If auth passed, generate a jwt with the user's id for quickly finding in db later
	let token = GEN_JWT(user);

	// Send jwt back as both a cookie and in the response.
	// Cookie will automatically get attached to all future requests,
	// so we don't have to worry about it on the client side.
	// TODO: change cookie settings so that browser is happy (sameDomain setting I think)
	res.cookie('jwt', token);
	res.status(200).json({ token });
};

// Personal information endpoint
// For a user with a jwt auth token, consume token and respond with personal info,
// such as username, email, and name.
module.exports.personalInfo = (ejwt(EJWT_OPTIONS), async (req, res) => {
	let user;

	// We are using the ejwt middleware, so the auth token has already been verified
	// (and rejected if necessary) and its payload has been decoded and added to req.user.
	// For token payload, see /api/login.
	try {
		user = await User.findById(req.user.id);
	} catch (err) {
		res.status(500).json(err);
		return;
	}

	if (user == null) {
		res.status(404).end();
	}

	// Respond with acquired information
	res.status(200).json({ username: user.username, email: user.email, name: user.name });
});

