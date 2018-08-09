'use strict';

const passport = require('passport');
const config = require('../config/environment');
const expressJwt = require('express-jwt');
const compose = require('composable-middleware');
const _ = require('lodash');
const model = require('../sqldb/model-connect');
const status = require('../config/status');

var validateJwt = expressJwt({
	secret: config.secrets.accessToken,
	requestProperty: 'authenticatedUSER',
	getToken: function(req) {
		if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
			return req.headers.authorization.split(' ')[1];
		} else if (req.cookies && req.cookies['gtc_access_token'] && req.cookies['gtc_refresh_token']) {
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
			var queryObj = {};
			if (req['authenticatedUSER']) {
				queryObj['status'] = status["ACTIVE"];
				queryObj['id'] = req['authenticatedUSER'].userId;

				model['User'].findOne({
					where: queryObj,
					attributes: {
						exclude: ['hashed_pwd', 'salt', 'email_verified_token', 'email_verified_token_generated', 'forgot_password_token', 'forgot_password_token_generated']
					}
				}).then(function(userObj) {
					if (userObj) {
						req.currentUser = userObj.toJSON();
						return next();
					}
				}).catch(function(error) {
					console.log('Error::::', error);
					return next(error);
				});
			}
		});
}