require('./api/data/db.js');					 // mongoose for mongodb database
const express = require('express');
const morgan = require('morgan');                // log requests to the console (express4)
const bodyParser = require('body-parser');       // pull information from HTML POST (express4)
const cookieParser = require('cookie-parser');
const path = require('path');
const routes = require('./api/routes');			// set up routes for our api's

const app = express();                        	// create our app w/ express
const port = process.env.PORT || 8888;

app.use((req,res,next) => {
	console.log(req.method, req.url);
	next();
})

//deliever index.html from dist/boargame-toolkit to the browser
app.use(express.static(path.join(__dirname,'/dist/boardgame-toolkit')));
app.use('node_modules', express.static(__dirname + '/node_modules'));

app.use('/', routes);

	// For all other get requests, send to index.html (allows for smooth Angular routing)
	//Not sure where to put this yet -- Tyler
	app.get('/*', (req, res, next) => {
		res.sendFile('/dist/boardgame-toolkit/index.html', { root: __dirname });
		}, (err) => {
		console.log("Error connecting to database:");
		console.error(err);
		});

// Allow get requests for all files in /dist/boardgame-toolkit (Angular output)
app.use(morgan('dev'));     // Log request statuses
app.use(bodyParser.urlencoded({ 'extended': 'true' }));
app.use(bodyParser.json()); // Translate json bodies
app.use(cookieParser());    // Find cookies
app.listen(port, () => {
	console.log(`App running on port ${port}`);
});