const jwt = require('jsonwebtoken');

module.exports.jwtSecret = process.env.JWT_SECRET || "keyboard cat";
// Since we're using cookie-parser middleware, cookies should be added to req.cookies.
// In /api/login and /api/register, we attached the auth token as the 'jwt' cookie.
module.exports.EJWT_OPTIONS = {
	secret: module.exports.jwtSecret,
	algorithms: ['HS512'],
	getToken: (req) => req.cookies.jwt
};

module.exports.GEN_JWT = (user) => jwt.sign({ id: user.id }, module.exports.jwtSecret, { expiresIn: "7d", algorithm: "HS512" });
