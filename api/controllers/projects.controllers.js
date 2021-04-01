const S3 = require('aws-sdk/clients/s3');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const Project = mongoose.model("Project");

const S3_BUCKET = process.env.S3_BUCKET;
const MAX_ASSET_SIZE = 4_000_000;

if (!S3_BUCKET) {
	console.error("S3 Bucket not found. Please add to S3_BUCKET environment variable (through .env file and heroku local command on local machines).");
	process.exit(1);
} else {
	console.log(`Using S3 bucket '${S3_BUCKET}'`);
}

// aws.config.region = "us-west-1";

// Create new project endpoint
// Take new project details (such as name), and create a new project.
// Respond with project id of new project.
module.exports.newProject = async (req, res) => {
	let user;

	if (req.body.hasThumbnail && (!req.body.thumbnailDeats.size || req.body.thumbnailDeats.size > MAX_ASSET_SIZE)) {
		res.status(500).json({ error: "Thumbnail size does not exist or exceeds max size.", maxSize: MAX_ASSET_SIZE });
		return;
	}

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

	if (req.body.hasThumbnail) {
		const s3 = new S3();

		// TODO: Change the key to something more unique
		const s3Params = {
			Bucket: S3_BUCKET,
			Key: `${user.username}/${project.name}/thumbnail`,
			Expires: 360,
			ContentType: req.body.thumbnailDeats.type,
			ACL: 'public-read',
			// ContentLength: req.body.thumbnailDeats.size,
		};

		const thumbnailUrl = `https://${s3Params.Bucket}.s3-us-west-1.amazonaws.com/${encodeURIComponent(s3Params.Key)}`;

		s3.getSignedUrlPromise('putObject', s3Params).then(async (signedUrl) => {
			console.log("Generated url:", signedUrl);

			project.thumbnail = thumbnailUrl;

			try {
				await project.save();
			} catch (err) {
				console.error("Could not save thumbnail URL:", err);
			}

			// Respond with new project's id and thumbnail upload URL
			res.status(200).json({ id: project.id, signedUrl });
		}, (err) => {
			console.log(err);
			res.status(500).json(err);
		});
	} else {
		// Respond with new project's id
		res.status(200).json({ id: project.id });
	}
}


// Get list of personal projects endpoint
// No information needed, just auth token.
// Respond with list of project names and IDs.
module.exports.listProjects = async (req, res) => {
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
		projects.push({ name: project.name, id: project.id, modified: project.date.modified, thumbnail: project.thumbnail });
	}

	// Respond with list of projects
	res.status(200).json(projects);

}