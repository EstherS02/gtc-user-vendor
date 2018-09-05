'use strict';

const passport = require('passport');
const moment = require('moment');
const config = require('../config/environment');
const expressJwt = require('express-jwt');
const compose = require('composable-middleware');
const _ = require('lodash');
const model = require('../sqldb/model-connect');
const planPermissions = require('../config/plan-marketplace-permission.js');
const status = require('../config/status');
const roles = require('../config/roles');
const service = require('../api/service');

var validateJwt = expressJwt({
	secret: config.secrets.accessToken,
	getToken: function(req) {
		if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
			return req.headers.authorization.split(' ')[1];
		} else if (req.cookies && req.cookies['gtc_access_token'] && req.cookies['gtc_refresh_token']) {
			return req.cookies['gtc_access_token'];
		}
		return null;
	}
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
		.use(function(err, req, res, next) {
			if (err.name === 'UnauthorizedError') {
				if (new RegExp("api").test(req.originalUrl) || new RegExp("auth").test(req.originalUrl)) {
					return res.status(err.status).send({
						message: err.message
					});
				} else {
					return res.redirect('/login');
				}
			}
			next();
		})
		.use(function(req, res, next) {
			let queryObj = {};

			queryObj['id'] = req.user.userId;

			model['User'].findOne({
					where: queryObj,
					attributes: {
						exclude: ['hashed_pwd', 'salt', 'email_verified_token', 'email_verified_token_generated', 'forgot_password_token', 'forgot_password_token_generated']
					}
				}).then(function(user) {
					if (user) {
						req.user = plainTextResponse(user);

						let vendorQueryObj = {};

						vendorQueryObj['status'] = {
							'$eq': status["ACTIVE"]
						}

						vendorQueryObj['user_id'] = req.user.id;

						model['Vendor'].findOne({
							where: vendorQueryObj,

							include: [{
								model: model['Country']
							}, {
								model: model['Currency']
							}, {
								model: model['Timezone']
							}, {
								model: model['VendorPlan'],
							}, {
								model: model['VendorVerification'],
								required: false
							}]
						}).then(function(vendorObj) {
							if (vendorObj) {
								req.user['Vendor'] = vendorObj.toJSON();
								req.user['VendorStatus'] = true;
								return next();
							} else {
								req.user['Vendor'] = false;
								return next();
							}
						}).catch(function(error) {
							req.user['Vendor'] = false;
							return next();
						});
						//next();
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

function isAuthenticatedUser() {
	return compose()
		.use(function(req, res, next) {
			if (req.query && req.query.hasOwnProperty('access_token')) {
				req.headers.authorization = 'Bearer ' + req.query.access_token;
			}
			validateJwt(req, res, next);
		})
		.use(function(err, req, res, next) {
			if (err.name === 'UnauthorizedError') {
				if (new RegExp("api").test(req.originalUrl) || new RegExp("auth").test(req.originalUrl)) {
					return res.status(err.status).send({
						message: err.message
					});
				} else {
					return res.redirect('/login');
				}
			}
			next();
		})
		.use(function(req, res, next) {
			var queryObj = {};

			queryObj['status'] = status["ACTIVE"];
			queryObj['id'] = req.user.userId;

			model['User'].findOne({
				where: queryObj,
				attributes: {
					exclude: ['hashed_pwd', 'salt', 'email_verified_token', 'email_verified_token_generated', 'forgot_password_token', 'forgot_password_token_generated']
				}
			}).then(function(userObj) {
				if (userObj) {
					const user = userObj.toJSON();
					req.user = user;
					return next();
				}
			}).catch(function(error) {
				console.log('Error::::', error);
				return next(error);
			});
		});
}

function isLoggedIn() {
	return compose()
		.use(function(req, res, next) {
			if (req.query && req.query.hasOwnProperty('access_token')) {
				req.headers.authorization = 'Bearer ' + req.query.access_token;
			}
			validateJwt(req, res, next);
		})
		.use(function(err, req, res, next) {
			if (err.name === 'UnauthorizedError') {
				next();
			}
		});
}

function hasRole(roleRequired) {
	if (!roleRequired) throw new Error('Required role needs to be set');
	const vendorIncludeArray = [{
		model: model["Country"],
		where: {
			status: status['ACTIVE']
		},
		attributes: ['id', 'name', 'code', 'currency_id', 'status']
	}, {
		model: model["Currency"],
		where: {
			status: status['ACTIVE']
		},
		attributes: ['id', 'name', 'symbol', 'code', 'decimal_points', 'status']
	}, {
		model: model["Timezone"],
		where: {
			status: status['ACTIVE']
		},
		required: false,
		attributes: ['id', 'country_id', 'timezone', 'timezone_abbreviation', 'status']
	}, {
		model: model["VendorPlan"],
		where: {
			status: status['ACTIVE']
		},
		attributes: ['id', 'vendor_id', 'plan_id', 'start_date', 'end_date', 'status'],
		include: [{
			model: model["Plan"],
			where: {
				status: status['ACTIVE']
			},
			attributes: ['id', 'name', 'cost', 'description', 'duration', 'duration_unit', 'status']
		}],
		required: false
	}, {
		model: model["VendorVerification"],
		where: {
			status: status['ACTIVE']
		},
		attributes: ['id', 'vendor_verified_status', 'status'],
		required: false
	}];

	return compose()
		.use(isAuthenticatedUser())
		.use(function(req, res, next) {
			var queryObj = {};

			queryObj['user_id'] = req.user.id;
			queryObj['status'] = status['ACTIVE'];

			if (roleRequired === roles['ADMIN']) {
				// only allow admin
				if (req.user.role === roles['ADMIN']) {
					service.findOneRow('Admin', queryObj)
						.then(function(result) {
							if (result) {
								req.user['Admin'] = result;
								return next();
							} else {
								return res.status(403).send("Forbidden");
							}
						}).catch(function(error) {
							console.log('Error::::', error);
							return next(error);
						});
				} else {
					return res.status(403).send("Forbidden");
				}
			} else if (roleRequired === roles['VENDOR']) {
				// allows admin and vendor
				if (req.user.role === roles['ADMIN']) {
					service.findOneRow('Admin', queryObj)
						.then(function(result) {
							if (result) {
								req.user['Admin'] = result;
								return next();
							} else {
								return res.status(403).send("Forbidden");
							}
						}).catch(function(error) {
							console.log('Error::::', error);
							return next(error);
						});
				} else if (req.user.role === roles['VENDOR']) {
					service.findOneRow('Vendor', queryObj, vendorIncludeArray)
						.then(function(result) {
							if (result) {
								req.user['Vendor'] = result;
								return next();
							} else {
								return res.status(403).send("Forbidden");
							}
						}).catch(function(error) {
							console.log('Error::::', error);
							return next(error);
						});
				} else {
					return res.status(403).send("Forbidden");
				}
			} else if (roleRequired === roles['USER']) {
				// allows admin, vendor admin user
				if (req.user.role === roles['ADMIN']) {
					service.findOneRow('Admin', queryObj)
						.then(function(result) {
							if (result) {
								req.user['Admin'] = result;
								return next();
							} else {
								return res.status(403).send("Forbidden");
							}
						}).catch(function(error) {
							console.log('Error::::', error);
							return next(error);
						});
				} else if (req.user.role === roles['VENDOR']) {
					service.findOneRow('Vendor', queryObj, vendorIncludeArray)
						.then(function(result) {
							if (result) {
								req.user['Vendor'] = result;
								return next();
							} else {
								return res.status(403).send("Forbidden");
							}
						}).catch(function(error) {
							console.log('Error::::', error);
							return next(error);
						});
				} else if (req.user.role === roles['USER']) {
					return next();
				} else {
					return res.status(403).send("Forbidden");
				}
			} else {
				return res.status(403).send("Forbidden");
			}
		});
}

function hasPermission() {
	return compose()
		.use(function(req, res, next) {
			if (req.user.role === roles['ADMIN']) {
				return next();
			} else if (req.user.role === roles['VENDOR']) {
				var vendorCurrentPlan = req.user.Vendor.VendorPlans[0];
				if (vendorCurrentPlan) {
					const currentDate = moment().format('YYYY-MM-DD');
					const planStartDate = moment(vendorCurrentPlan.start_date).format('YYYY-MM-DD');
					const planEndDate = moment(vendorCurrentPlan.end_date).format('YYYY-MM-DD');
					if (currentDate >= planStartDate && currentDate <= planEndDate) {
						req.checkBody('marketplace_id', 'Marketplace Query Param Missing').notEmpty();
						var errors = req.validationErrors();
						if (errors) {
							res.status(400).send('Missing Query Params');
							return;
						}
						var actionsValues = planPermissions[vendorCurrentPlan.plan_id][req.body.marketplace_id];
						if (actionsValues && Array.isArray(actionsValues) && actionsValues.length > 0) {
							if (getIndexOfAction(actionsValues, '*') > -1) {
								return next();
							} else {
								res.send(403, "Forbidden");
								return;
							}
						} else {
							return res.status(403).send("Forbidden");
						}
					} else {
						return res.status(403).send("Sorry your plan expired.");
					}
				} else {
					return res.status(403).send("Please buy a plan to proceed");
				}
			} else {
				return res.status(403).send("Forbidden");
			}
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

function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}

exports.isAuthenticated = isAuthenticated;
exports.isAuthenticatedUser = isAuthenticatedUser;
exports.isLoggedIn = isLoggedIn;
exports.hasRole = hasRole;
exports.hasPermission = hasPermission;