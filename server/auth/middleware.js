'use strict';

const expressJwt = require('express-jwt');
const compose = require('composable-middleware');
const config = require('../config/environment');

var validateJwt = expressJwt({
	secret: config.secrets.accessToken,
	requestProperty: 'gtcGlobalUserObj',
	getToken: function(req) {
		if (req.cookies && req.cookies['gtc_access_token'] && req.cookies['gtc_refresh_token']) {
			return req.cookies['gtc_access_token'];
		}
		return null;
	}
});

module.exports = function() {
	return compose()
		.use(function(req, res, next) {
			validateJwt(req, res, next);
		})
		.use(function(err, req, res, next) {
			if (err.name === 'UnauthorizedError') {
				next();
			}
		})
		.use(function(req, res, next) {
			console.log("req.gtcGlobalUserObj", req.gtcGlobalUserObj);
			next();
		})
}