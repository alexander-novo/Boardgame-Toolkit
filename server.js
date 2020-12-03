var express = require('express');
var mongoose = require('mongoose');            // mongoose for mongodb
var morgan = require('morgan');                // log requests to the console (express4)
var bodyParser = require('body-parser');       // pull information from HTML POST (express4)

const User = require("./schemas/user");

var app = express();                        // create our app w/ express
var port = process.env.PORT || 8888;
var dbUri = process.env.MONGODB_URI || "mongodb://localhost/TestDB";

mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }).then(() => {
	console.log("Connected to database!");

	app.post("/api/login", async (req, res) => {
		// TODO: Actual input validation
		try {
			var user = await User.findOne({ username: req.body.username });

			if (!user) { res.sendStatus(404); return; }

			var isMatch = await user.comparePassword(req.body.password);

			res.sendStatus(isMatch ? 200 : 404);
		} catch (err) {
			console.log(err);
			res.status(500).json(err);
		}
	});

	app.post("/api/register", async (req, res) => {
		// TODO: input validation
		console.log("Received register request:");
		console.log(req.body);

		var user = new User(req.body);
		try {
			await user.save();

			res.status(200).json({ auth: "todo" });
		} catch (err) {
			console.log(err);
			res.status(500).json(err);
		}
	});

	app.get("/api/check-unique-user", async (req, res) => {
		console.log("Received unique request:");

		try {
			let userUnique = !await User.exists({ username: req.query.user });
			let emailUnique = !await User.exists({ email: req.query.email });

			console.log(req.query);
			res.status(200).json({ emailUnique, userUnique });
		} catch (err) {
			res.status(500).json(err);
		}
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


app.listen(port, () => {
	console.log(`App running on port ${port}`);
});