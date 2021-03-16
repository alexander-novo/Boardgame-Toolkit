const mongoose = require('mongoose');
const User = mongoose.model('User')
const axios = require('axios').default;
const ejwt = require('express-jwt');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || "keyboard cat";
const fs = require('fs');
const captchaSecret = process.env.RECAPTCHA_SECRET || JSON.parse(fs.readFileSync("captcha_secret.json"));

if (!captchaSecret) { console.error("Google ReCaptcha secret not found. Please add to captcha_secret.json"); process.exit(1); }

// Since we're using cookie-parser middleware, cookies should be added to req.cookies.
// In /api/login and /api/register, we attached the auth token as the 'jwt' cookie.
const EJWT_OPTIONS = { 	
	secret: jwtSecret,
	algorithms: ['HS512'],
	getToken: (req) => req.cookies.jwt 
	};


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

// Personal information endpoint
// For a user with a jwt auth token, consume token and respond with personal info,
// such as username, email, and name.
module.exports.personalInfo = (ejwt(EJWT_OPTIONS),async (req,res) =>{
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
    
    // Respond with acquired information
    res.status(200).json({ username: user.username, email: user.email, name: user.name });
    });

    