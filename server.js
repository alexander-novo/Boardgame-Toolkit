var express = require('express');
var mongoose = require('mongoose');            // mongoose for mongodb
var morgan = require('morgan');                // log requests to the console (express4)
var bodyParser = require('body-parser');       // pull information from HTML POST (express4)

var app = express();                        // create our app w/ express
var port = process.env.PORT || 8888;
var dbUri = process.env.MONGODB_URI || "mongodb://localhost/TestDB";

mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
	console.log("Connected to database!");
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