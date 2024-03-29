const express = require('express');
const ejwt = require('express-jwt');
const { EJWT_OPTIONS } = require('../jwt');

//instasiate router
const router = express.Router();

//controllers
const ctrLogin = require('../controllers/login.controllers');
const ctrRegister = require('../controllers/register.controllers');
const ctrProjects = require('../controllers/projects.controllers');
const ctrLobbies = require('../controllers/lobbies.controller')

module.exports.routes = router;
module.exports.configureSocketIo = function (io) {
	ctrLobbies.configureSocketIo(io);
};

router
	.route('/api/login')
	.post(ctrLogin.loginUser);

router
	.route('/api/register')
	.post(ctrRegister.registerUser);

router
	.route('/api/users/unique')
	.get(ctrRegister.uniqueUser);

router
	.route('/api/users/me')
	.get(ejwt(EJWT_OPTIONS), ctrLogin.personalInfo);

router
	.route('/api/projects/new')
	.put(ejwt(EJWT_OPTIONS), ctrProjects.newProject);

router
	.route('/api/projects/mine')
	.get(ejwt(EJWT_OPTIONS), ctrProjects.listProjects);

router
	.route('/api/projects/public')
	.get(ctrProjects.listPublicProjects);

router
	.route('/api/projects/project')
	.get(ejwt(EJWT_OPTIONS), ctrProjects.getProject)
	.put(ejwt(EJWT_OPTIONS), ctrProjects.saveProject);

router
	.route('/api/projects/assets/new')
	.put(ejwt(EJWT_OPTIONS), ctrProjects.newAssets);

router
	.route('/api/projects/collection/thumbnail')
	.put(ejwt(EJWT_OPTIONS), ctrProjects.collectionThumbnail);

router
	.route('/api/lobbies')
	.put(ejwt(EJWT_OPTIONS), ctrLobbies.newLobby)
	.get(ejwt(EJWT_OPTIONS), ctrLobbies.listLobbies);