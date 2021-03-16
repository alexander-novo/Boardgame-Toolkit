const express = require('express');
//instasiate router
const router = express.Router();
const ejwt = require('express-jwt');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || "keyboard cat";
// Since we're using cookie-parser middleware, cookies should be added to req.cookies.
// In /api/login and /api/register, we attached the auth token as the 'jwt' cookie.
const EJWT_OPTIONS = { 	
	secret: jwtSecret,
	algorithms: ['HS512'],
	getToken: (req) => req.cookies.jwt 
	};
const GEN_JWT = (user) => jwt.sign({ id: user.id }, jwtSecret, { expiresIn: "7d", algorithm: "HS512" });
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
        .route('api/uses/me')
        .get(ejwt(EJWT_OPTIONS),ctrLogin.personalInfo)
    router  
        .route('/api/projects/new')
        .put(ejwt(EJWT_OPTIONS), ctrProjects.newProject)

    router
        .route('/api/projects/mine')
        .get(ejwt(EJWT_OPTIONS),ctrProjects.listProjects)

module.exports = router;