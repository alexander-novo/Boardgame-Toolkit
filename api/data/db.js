const mongoose = require('mongoose');
const dbUri = process.env.MONGODB_URI || "mongodb://localhost/TestDB";

mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }).then(() => {
	console.log("Connected to database!");
});

mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to ' + dbUri);
})

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconected');
})

mongoose.connection.on('error', (err) => {
    console.log('Mongoose connection error:' + err);
})

//capture event of control + c terminating app --UNIX
process.on('SIGNIT',() => {
    mongoose.connection.close(() => {
        console.log('Mongoose dosconnected through app termination (SIGTERM)');
        process.exit(0);
    });
})
//capture event of restarting nodemon --dev tool only!
process.once('SIGUSR2',() => {
    mongoose.connection.close(() => {
        console.log('Mongoose dosconnected through app termination (SIGUSR3)');
        process.kill(process.pid, 'SIGUSR2');
    });
})

require('./schemas/user.model.js')
require('./schemas/project.model.js')