'use strict';

var async = require('async');
const service = require('../../api/service');
const status = require('../../config/status');
const roles = require('../../config/roles');
const vendorPlan = require('../../config/gtc-plan');
const cartService = require('../../api/cart/cart.service');
const marketplace = require('../../config/marketplace');

export function vendorForm(req, res) {

	var countryModel = "Country";
	var currencyModel = "Currency";
	var timezoneModel = "Timezone";
	var offset, limit, field, order;
	var queryObj = {};
	var LoggedInUser = {};
	var bottomCategory = {};
	var categoryModel = "Category";

	offset = 0;
	limit = null;
	field = "id";
	order = "asc";

	if (req.user) {
		LoggedInUser = req.user;
	}

	async.series({
		cartInfo: function(callback) {
			if (LoggedInUser.id) {
				cartService.cartCalculation(LoggedInUser.id)
					.then((cartResult) => {
						return callback(null, cartResult);
					}).catch((error) => {
						return callback(error);
					});
			} else {
				return callback(null);
			}
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
		country: function(callback) {
			const countryField = 'name';
			const countryOrder = 'ASC';

			service.findRows(countryModel, queryObj, offset, limit, countryField, countryOrder)
				.then(function(country) {
					return callback(null, country.rows);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		currency: function(callback) {
			service.findRows(currencyModel, queryObj, offset, limit, field, order)
				.then(function(currency) {
					return callback(null, currency.rows);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		timezone: function(callback) {
			service.findRows(timezoneModel, queryObj, offset, limit, field, order)
				.then(function(timezone) {
					return callback(null, timezone.rows);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		}
	}, function(error, results) {
		if (!error) {
			if (LoggedInUser.role == roles['VENDOR']) {
				res.redirect('/')
			} else {
				res.render('vendor-form', {
					title: "Global Trade Connect",
					categories: results.categories,
					bottomCategory: bottomCategory,
					LoggedInUser: LoggedInUser,
					country: results.country,
					cart: results.cartInfo,
					marketPlace: marketplace,
					currency: results.currency,
					timezone: results.timezone,
					selectedPage: 'vendor-form',
					vendorPlan: vendorPlan
				});
			}
		} else {
			res.render('vendor-form', error);
		}
	});
}