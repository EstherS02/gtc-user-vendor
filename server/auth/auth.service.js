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
			model['User'].findById(req.user.userId)
				.then(function(user) {
					if (user) {
						req.user = plainTextResponse(user);
						next();
					} else {
						res.status(404).send("User not found");
						return;
					}
				})
				.catch(function(error) {
					console.log('Error:::', error);
					return next(error);
				});
		});
}

function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}

function hasPermission(withAction) {
	console.log('withAction', withAction);
	if (!withAction) throw new Error('Required action needs to be set');

	return compose()
		.use(isAuthenticated())
		.use(function(req, res, next) {
			return;
		});
}

function getIndexOfAction(array, value) {
	if (value) {
		if (array.length > 0) {
			for (var i = 0; i < array.length; i++) {
				if (array[i]) {
					if (array[i] == value) {
						return i;
					}
				}
			}
		}
		return -1;
	}
}

exports.isAuthenticated = isAuthenticated;
exports.hasPermission = hasPermission;