const mongoose = require('mongoose');
const User = mongoose.model('User')
const axios = require('axios').default;
const ejwt = require('express-jwt');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || "keyboard cat";

// Since we're using cookie-parser middleware, cookies should be added to req.cookies.
// In /api/login and /api/register, we attached the auth token as the 'jwt' cookie.
const EJWT_OPTIONS = { 	
	secret: jwtSecret,
	algorithms: ['HS512'],
	getToken: (req) => req.cookies.jwt 
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