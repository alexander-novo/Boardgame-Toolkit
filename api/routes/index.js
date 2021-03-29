const express = require('express');
const ejwt = require('express-jwt');
const { EJWT_OPTIONS } = require('../jwt');
//instasiate router
const router = express.Router();

//controllers
const ctrLogin = require('../controllers/login.controllers');
const ctrRegister = require('../controllers/register.controllers');
const ctrProjects = require('../controllers/projects.controllers');

router
	.route('/api/login')
	.post(ctrLogin.loginUser)

router
	.route('/api/register')
	.post(ctrRegister.registerUser)

router
	.route('/api/users/unique')
	.get(ctrLogin.uniqueUser)

router
	.route('/api/users/me')
	.get(ejwt(EJWT_OPTIONS), ctrLogin.personalInfo)
router
	.route('/api/projects/new')
	.put(ejwt(EJWT_OPTIONS), ctrProjects.newProject)

router
	.route('/api/projects/mine')
	.get(ejwt(EJWT_OPTIONS), ctrProjects.listProjects)

module.exports = router;