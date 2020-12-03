var express = require('express');
var mongoose = require('mongoose');            // mongoose for mongodb
var morgan = require('morgan');                // log requests to the console (express4)
var bodyParser = require('body-parser');       // pull information from HTML POST (express4)
var cookieParser = require('cookie-parser');
var ejwt = require('express-jwt');
var jwt = require('jsonwebtoken');

const User = require("./schemas/user");
const Project = require("./schemas/project");

// Since we're using cookie-parser middleware, cookies should be added to req.cookies.
// In /api/login and /api/register, we attached the auth token as the 'jwt' cookie.
const EJWT_OPTIONS = { secret: jwtSecret, algorithms: ['HS512'], getToken: (req) => req.cookies.jwt };
const GEN_JWT = (user) => jwt.sign({ id: user.id }, jwtSecret, { expiresIn: "7d", algorithm: "HS512" });

var app = express();                        // create our app w/ express
var port = process.env.PORT || 8888;
var dbUri = process.env.MONGODB_URI || "mongodb://localhost/TestDB";
var jwtSecret = process.env.JWT_SECRET || "keyboard cat";

mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }).then(() => {
	console.log("Connected to database!");

	// Login endpoint
	// Take credentials (username, password).
	// Return a jwt auth token.
	app.post("/api/login",
		async (req, res) => {
			var user;

			try {
				user = await User.findOne({ username: req.body.username });
			} catch (err) {
				res.status(500).json(err);
			}

			// Don't differentiate between incorrect password and user can't be found.
			if (!user || !await user.comparePassword(req.body.password)) {
				res.status(401).json("Access denied");
			}

			// If auth passed, generate a jwt with the user's id for quickly finding in db later
			let token = GEN_JWT(user);

			// Send jwt back as both a cookie and in the response.
			// Cookie will automatically get attached to all future requests,
			// so we don't have to worry about it on the client side.
			// TODO: change cookie settings so that browser is happy (sameDomain setting I think)
			res.cookie('jwt', token);
			res.status(200).json({ token });
		});

	// Register endpoint
	// Take new account info (username, password, email, name, etc.).
	// Generate new account, then sign in.
	// TODO: Google Captcha?
	app.post("/api/register", async (req, res) => {
		// TODO: input validation

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
			res.status(200).json({ token });
		} catch (err) {
			// TODO: check the error and see if it is an input error. If so, respond to client with instructions on how to fix
			console.log(err);
			res.status(500).json(err);
		}
	});

	// Unique user endpoint
	// Take username and email.
	// Respond with whether or not those are already in the database.
	app.get("/api/users/unique", async (req, res) => {
		try {
			// Check if the username or email is in the database
			// TODO: This could probably be done with one query instead of 2 separate ones?
			let userUnique = !await User.exists({ username: req.query.user });
			let emailUnique = !await User.exists({ email: req.query.email });

			// Respond with uniqueness
			res.status(200).json({ emailUnique, userUnique });
		} catch (err) {
			res.status(500).json(err);
		}
	});

	// Personal information endpoint
	// For a user with a jwt auth token, consume token and respond with personal info,
	// such as username, email, and name.
	app.get("/api/users/me", ejwt(EJWT_OPTIONS), async (req, res) => {
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

	// Create new project endpoint
	// Take new project details (such as name), and create a new project.
	// Respond with project id of new project.
	app.put('/api/projects/new', ejwt(EJWT_OPTIONS), async (req, res) => {
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

		// Create new project with sent details
		let project = new Project({
			name: req.body.name,
			owner: user.id,
		});

		try {
			// Attempt to save project to database.
			// Validators will check to see that the project is valid and throw and error if not.
			await project.save();

			// Add this new project to the user's list of projects, then save user
			user.projects.push(project.id);
			await user.save();
		} catch (err) {
			// TODO: look at error and respond with instructions for the client if possible
			res.status(500).json(err);
			return;
		}

		// Respond with new project's id
		res.status(200).json({ id: project.id });
	});

	// Get list of personal projects endpoint
	// No information needed, just auth token.
	// Respond with list of project names and IDs.
	app.get('/api/projects/mine', ejwt(EJWT_OPTIONS), async (req, res) => {
		let user;

		// We are using the ejwt middleware, so the auth token has already been verified
		// (and rejected if necessary) and its payload has been decoded and added to req.user.
		// For token payload, see /api/login.

		// Populate the found user to replace project IDs with the full project documents.
		try {
			user = await User.findById(req.user.id).populate('projects');
		} catch (err) {
			res.status(500).json(err);
		}

		// TODO: this could probably be done better
		let projects = [];
		for (var project of user.projects) {
			projects.push({ name: project.name, id: project.id, modified: project.date.modified });
		}

		// Respond with list of projects
		res.status(200).json(projects);
	});

	// For all other get requests, send to index.html (allows for smooth Angular routing)
	app.get('/*', function (req, res, next) {
		res.sendFile('/dist/boardgame-toolkit/index.html', { root: __dirname });
	});
}, (err) => {
	console.log("Error connecting to database:");
	console.error(err);
});

// Allow get requests for all files in /dist/boardgame-toolkit (Angular output)
app.use(express.static(__dirname + "/dist/boardgame-toolkit"));
app.use(morgan('dev'));     // Log request statuses
app.use(bodyParser.urlencoded({ 'extended': 'true' }));
app.use(bodyParser.json()); // Translate json bodies
app.use(cookieParser());    // Find cookies

app.listen(port, () => {
	console.log(`App running on port ${port}`);
});