'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const providersCode = require('../../config/providers');
const addressCode = require('../../config/address');
const service = require('../../api/service');
const async = require('async');
const populate = require('../../utilities/populate');
const vendorPlan = require('../../config/gtc-plan');
const cartService = require('../../api/cart/cart.service');
const marketplace = require('../../config/marketplace');

export function userProfile(req, res) {

	var vendorModel = "Vendor";
	var UserModel = "User"
	var addressModel = "Address";
	var countryModel = "Country";
	var categoryModel = "Category";
	var vendorIncludeArr = [];
	var addressIncludeArr = [];
	var bottomCategory = {};

	vendorIncludeArr = populate.populateData('User');
	addressIncludeArr = populate.populateData('Country,State');

	var offset, limit, field, order;
	var queryObj = {},
		LoggedInUser = {};


	offset = 0;
	limit = null;
	field = "id";
	order = "asc";

	if (req.user)
		LoggedInUser = req.user;
	let user_id = LoggedInUser.id;


	async.series({
		cartInfo: function(callback) {
			if (LoggedInUser.id) {
				cartService.cartCalculation(LoggedInUser.id, req)
					.then((cartResult) => {
						return callback(null, cartResult);
					}).catch((error) => {
						return callback(error);
					});
			} else {
				return callback(null);
			}
		},
		vendor: function(callback) {
			service.findOneRow(vendorModel, {
					user_id: user_id
				}, vendorIncludeArr)
				.then(function(vendor) {
					return callback(null, vendor);
				}).catch(function(error) {
					return callback(null);
				});
		},
		user: function(callback) {
			service.findOneRow(UserModel, {
					id: user_id
				})
				.then(function(user) {
					console.log("user", user);
					return callback(null, user);
				}).catch(function(error) {
					return callback(null);
				});
		},
		shippingAddress: function(callback) {
			service.findOneRow(addressModel, {
					user_id: user_id,
					address_type: addressCode['SHIPPINGADDRESS']
				}, addressIncludeArr)
				.then(function(shippingAddress) {
					return callback(null, shippingAddress);
				}).catch(function(error) {
					return callback(null);
				});
		},
		billingAddress: function(callback) {
			service.findOneRow(addressModel, {
					user_id: user_id,
					address_type: addressCode['BILLINGADDRESS']
				}, addressIncludeArr)
				.then(function(billingAddress) {
					return callback(null, billingAddress);
				}).catch(function(error) {
					return callback(null);
				});
		},
		country: function(callback) {
			service.findRows(countryModel, queryObj, offset, limit, field, order)
				.then(function(country) {
					return callback(null, country.rows);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		categories: function(callback) {
			var includeArr = [];
			const categoryOffset = 0;
			const categoryLimit = null;
			const categoryField = "id";
			const categoryOrder = "asc";
			const categoryQueryObj = {};

			categoryQueryObj['status'] = status["ACTIVE"];

			service.findAllRows(categoryModel, includeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
				.then(function(category) {
					var categories = category.rows;
					bottomCategory['left'] = categories.slice(0, 8);
					bottomCategory['right'] = categories.slice(8, 16);
					return callback(null, category.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
	}, function(err, results) {
		if (!err) {
			res.render('userNav/user-profile', {
				title: "Global Trade Connect",
				vendor: results.vendor,
				user: results.user,
				shippingAddress: results.shippingAddress,
				billingAddress: results.billingAddress,
				country: results.country,
				LoggedInUser: LoggedInUser,
				selectedPage: 'user-profile',
				vendorPlan: vendorPlan,
				cart: results.cartInfo,
				marketPlace: marketplace,
				bottomCategory: bottomCategory,
				categories: results.categories,
				providersCode: providersCode
			});
		} else {
			res.render('userNav/user-profile', err);
		}
	});
}

export function forgotPassword(req, res) {
	var categoryModel = "Category";
	var bottomCategory = {};

	async.series({
		categories: function(callback) {
			var includeArr = [];
			const categoryOffset = 0;
			const categoryLimit = null;
			const categoryField = "id";
			const categoryOrder = "asc";
			const categoryQueryObj = {};

			categoryQueryObj['status'] = status["ACTIVE"];

			service.findAllRows(categoryModel, includeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
				.then(function(category) {
					var categories = category.rows;
					bottomCategory['left'] = categories.slice(0, 8);
					bottomCategory['right'] = categories.slice(8, 16);
					return callback(null, category.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
	}, function(err, results) {
		if (!err) {
			res.render('users/forgot-password', {
				title: "Global Trade Connect",
				bottomCategory: bottomCategory,
				categories: results.categories
			});
		} else {
			res.render('userNav/user-profile', err);
		}
	});
}


export function resetPassword(req, res) {
	var categoryModel = "Category";
	var bottomCategory = {};
	var email_id = req.query.email;
	var forgot_password_token = req.query.forgot_password_token;

	async.series({
		categories: function(callback) {
			var includeArr = [];
			const categoryOffset = 0;
			const categoryLimit = null;
			const categoryField = "id";
			const categoryOrder = "asc";
			const categoryQueryObj = {};

			categoryQueryObj['status'] = status["ACTIVE"];

			service.findAllRows(categoryModel, includeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
				.then(function(category) {
					var categories = category.rows;
					bottomCategory['left'] = categories.slice(0, 8);
					bottomCategory['right'] = categories.slice(8, 16);
					return callback(null, category.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
	}, function(err, results) {
		if (!err) {
			res.render('users/password-reset', {
				title: "Global Trade Connect",
				email_id: email_id,
				forgot_password_token: forgot_password_token,
				bottomCategory: bottomCategory,
				categories: results.categories
			});
		} else {
			res.render('userNav/user-profile', err);
		}
	});
}