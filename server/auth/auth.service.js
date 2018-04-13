'use strict';

const passport = require('passport');
const config = require('../config/environment');
const expressJwt = require('express-jwt');
const compose = require('composable-middleware');
const _ = require('lodash');
const model = require('../sqldb/model-connect');

var validateJwt = expressJwt({
	secret: config.secrets.accessToken
});
var globalValidateJwt = expressJwt({
	secret: config.secrets.globalAccessToken
});

function isAuthenticated() {
	return compose()
		.use(function(req, res, next) {
			if (req.query && req.query.hasOwnProperty('access_token')) {
				req.headers.authorization = 'Bearer ' + req.query.access_token;
			}
			validateJwt(req, res, next);
		})

	.use(function(req, res, next) {
		req.client = req.user.client;
		model['User'].findById(req.user.userId)
			.then(function(user) {
				if (user) {
					req.user = user;
					next();
				}
			})
			.catch(function(error) {
				if (error) {
					return next(error);
				}
			});
	});
}

exports.isAuthenticated = isAuthenticated;