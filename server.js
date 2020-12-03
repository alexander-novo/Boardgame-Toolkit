var express = require('express');
var mongoose = require('mongoose');            // mongoose for mongodb
var morgan = require('morgan');                // log requests to the console (express4)
var bodyParser = require('body-parser');       // pull information from HTML POST (express4)
var cookieParser = require('cookie-parser');
var ejwt = require('express-jwt');
var jwt = require('jsonwebtoken');

const User = require("./schemas/user");
const Project = require("./schemas/project");
const project = require('./schemas/project');

var app = express();                        // create our app w/ express
var port = process.env.PORT || 8888;
var dbUri = process.env.MONGODB_URI || "mongodb://localhost/TestDB";
var jwtSecret = process.env.JWT_SECRET || "keyboard cat";

mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }).then(() => {
	console.log("Connected to database!");

	app.post("/api/login",
		async (req, res) => {
			var user;

			try {
				user = await User.findOne({ username: req.body.username });
			} catch (err) {
				res.status(500).json(err);
			}

			if (!user || !await user.comparePassword(req.body.password)) {
				res.status(401).json("Access denied");
			}

			let token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: "7d", algorithm: "HS512" });

			res.cookie('jwt', token);
			res.status(200).json({ token });
		});

	app.post("/api/register", async (req, res) => {
		// TODO: input validation
		console.log("Received register request:");
		console.log(req.body);

		var user = new User(req.body);
		try {
			await user.save();

			const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: "7d", algorithm: "HS512" });
			res.status(200).json({ token });
		} catch (err) {
			console.log(err);
			res.status(500).json(err);
		}
	});

	app.get("/api/users/unique", async (req, res) => {
		try {
			let userUnique = !await User.exists({ username: req.query.user });
			let emailUnique = !await User.exists({ email: req.query.email });

			console.log(req.query);
			res.status(200).json({ emailUnique, userUnique });
		} catch (err) {
			res.status(500).json(err);
		}
	});

	app.get("/api/users/me", ejwt({ secret: jwtSecret, algorithms: ['HS512'], getToken: (req) => req.cookies.jwt }), async (req, res) => {
		let user;

		try {
			user = await User.findById(req.user.id);
		} catch (err) {
			res.status(500).json(err);
			return;
		}

		res.status(200).json({ username: user.username, email: user.email, name: user.name });
	});

	app.put('/api/projects/new', ejwt({ secret: jwtSecret, algorithms: ['HS512'], getToken: (req) => req.cookies.jwt }), async (req, res) => {
		let user;

		try {
			user = await User.findById(req.user.id);
		} catch (err) {
			res.status(500).json(err);
			return;
		}

		console.log("Attempting to create new project:");
		console.log(req.body);

		let project = new Project({
			name: req.body.name,
			owner: user.id,
		});

		try {
			await project.save();
			user.projects.push(project.id);
			await user.save();
		} catch (err) {
			res.status(500).json(err);
			return;
		}

		res.status(200).json({ id: project.id });
	});

	app.get('/api/projects/mine', ejwt({ secret: jwtSecret, algorithms: ['HS512'], getToken: (req) => req.cookies.jwt }), async (req, res) => {
		let user;

		try {
			user = await User.findById(req.user.id).populate('projects');
		} catch (err) {
			res.status(500).json(err);
		}

		let projects = [];
		for (var project of user.projects) {
			projects.push({ name: project.name, id: project.id, modified: project.date.modified });
		}

		res.status(200).json(projects);
	});

	app.all('/*', function (req, res, next) {
		// Just send the index.html for other files to support HTML5Mode
		res.sendFile('/dist/boardgame-toolkit/index.html', { root: __dirname });
	});
}, (err) => {
	console.log("Error connecting to database:");
	console.error(err);
});

app.use(express.static(__dirname + "/dist/boardgame-toolkit"));
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ 'extended': 'true' }));
app.use(bodyParser.json());
app.use(cookieParser());

app.listen(port, () => {
	console.log(`App running on port ${port}`);
});