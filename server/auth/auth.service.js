'use strict';

import config from '../config/environment';
import expressJwt from 'express-jwt';
import {Models} from '../sqldb';
import endPointModel from '../config/end_point.js';
import _ from 'lodash';
import compose from 'composable-middleware';
var sendRsp = require('../utils/response').sendRsp;

var validateJwt = expressJwt({
	secret: config.secrets.accessToken
});

var globalValidateJwt = expressJwt({
	secret: config.secrets.globalAccessToken
});

/**
 * user root access for isAuthenticated
 */
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
			Models[resourcesModel['users']].find({
					where: {
						id: req.user.userId
					},
					attributes: {
						exclude: ['salt', 'refresh_token', 'hashed_password', 'client_id']
					}
				})
				.then(userObj => {
					if (!userObj) {
						Models[resourcesModel['admins']].find({
								where: {
									id: req.user.userId
								},
								attributes: {
									exclude: ['salt', 'refresh_token', 'hashed_password', 'client_id']
								}
							})
							.then(adminObj => {
								var admin = adminObj['dataValues'];
								if (!admin) {
									log.error('Admin Not Found');
									return res.send(401);
								}
								req.user = admin;
								next();
							})
							.catch(err => {
								return next(err);
							})
					}
					var user = userObj['dataValues'];
					req.user = user;
					next();
				})
				.catch(err => {
					return next(err);
				})
		});
};

/**
 * Checks if the user role meets the minimum requirements of the route
 */
function hasRole(roleRequired) {
	if (!roleRequired) throw new Error('Required role needs to be set');

	return compose()
		.use(isAuthenticated())
		.use(function(req, res, next) {
			if (req.user.role === roleRequired) {
				next();
			} else {
				res.send(403);
			}
		});
};

/**
 * Set token cookie directly for oAuth strategies
 */
function setTokenCookie(req, res) {
	if (!req.user) return res.json(404, {
		message: 'Something went wrong, please try again.'
	});
	var token = signToken(req.user.id, req.user.role);
	res.cookie('token', JSON.stringify(token));
	res.redirect('/');
};

/**
 * Check user status
 */
function checkUserStatus() {
	return compose()
		.use(function(req, res, next) {
			Models[resourcesModel['users']].find({
					where: {
						email: req.body.email
					}
				})
				.then(userObj => {
					if (!userObj) {
						sendRsp(res, 401, "Invalid email or Password");
						return;
					}
					var user = userObj['dataValues'];
					if (user.is_active == false) {
						sendRsp(res, 403, "The user account has been suspended and user cannot be login.");
						return;
					}
					next();
				})
				.catch(err => {
					return next(err);
				})
		})
}

exports.isAuthenticated = isAuthenticated;
exports.hasRole = hasRole;
exports.setTokenCookie = setTokenCookie;
exports.checkUserStatus = checkUserStatus;