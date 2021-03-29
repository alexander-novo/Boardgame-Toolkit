const S3 = require('aws-sdk/clients/s3');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const Project = mongoose.model("Project");

// Since we're using cookie-parser middleware, cookies should be added to req.cookies.
// In /api/login and /api/register, we attached the auth token as the 'jwt' cookie.
const EJWT_OPTIONS = { 	
	secret: jwtSecret,
	algorithms: ['HS512'],
	getToken: (req) => req.cookies.jwt 
	};

// Create new project endpoint
// Take new project details (such as name), and create a new project.
// Respond with project id of new project.
module.exports.newProject = async (req,res) => {
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
}


// Get list of personal projects endpoint
// No information needed, just auth token.
// Respond with list of project names and IDs.
module.exports.listProjects = async(req,res) =>{

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
    
}