'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const dayCode = require('../../config/days');
const position = require('../../config/position');
const service = require('../../api/service');
const cartService = require('../../api/cart/cart.service');
const marketplace = require('../../config/marketplace');
const async = require('async');
const vendorPlan = require('../../config/gtc-plan');

export function talk(req, res) {
	var modelName = 'TalkSetting';
	var timeModel = "Timezone";
	var queryObj1 = {},
		LoggedInUser = {};
	var bottomCategory = {};
	var queryObj = {
		vendor_id: req.user.Vendor.id
	};
	var includeArr = [];

	if (req.user)
		LoggedInUser = req.user;
	let user_id = LoggedInUser.id;

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
		talk: function(callback) {
			service.findOneRow(modelName, queryObj, includeArr)
				.then(function(talkSetting) {
					return callback(null, talkSetting);
				})
				.catch(function(error) {
					consolelog('Error:::', error);
					return callback(error, null);
				})
		},
		busiHours: function(callback) {
			var includeArr1 = [{
				model: model['Timezone']
			}];
			service.findAllRows("BusinessHour", includeArr1, queryObj, 0, null, "id", "asc")
				.then(function(busiHours) {
					return callback(null, busiHours.rows);
				})
				.catch(function(error) {
					console.log('Error:::', error);
					return callback(error, null);
				})
		},
		timeZone: function(callback) {
			service.findAllRows(timeModel, includeArr, queryObj1, 0, null, "id", "asc")
				.then(function(timeZone) {
					return callback(null, timeZone.rows);
				})
				.catch(function(error) {
					console.log('Error:::', error);
					return callback(error, null);
				})
		},
		categories: function(callback) {
			var includeArr = [];
			const categoryOffset = 0;
			const categoryLimit = null;
			const categoryField = "id";
			const categoryOrder = "asc";
			var categoryModel = "Category";
			const categoryQueryObj = {};

			categoryQueryObj['status'] = statusCode["ACTIVE"];

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

		}
	}, function(error, results) {
		if (!error) {
			res.render('vendorNav/talk', {
				title: "Global Trade Connect",
				talk: results.talk,
				busiHours: results.busiHours,
				timeZone: results.timeZone,
				dayCode: dayCode,
				categories: results.categories,
				bottomCategory: bottomCategory,
				LoggedInUser: LoggedInUser,
				selectedPage: 'gtc-talk',
				cart: results.cartInfo,
				marketPlace: marketplace,
				vendorPlan: vendorPlan,
				statusCode:statusCode
			});
		} else {
			res.render('vendorNav/talk', error);
		}
	});
}


export function chat(req, res) {

	var LoggedInUser = {},
		bottomCategory = {};
	if (req.user)
		LoggedInUser = req.user;
	let user_id = LoggedInUser.id;

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
			var categoryModel = "Category";
			const categoryQueryObj = {};

			categoryQueryObj['status'] = statusCode["ACTIVE"];

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

		}
	}, function(error, results) {
		if (!error) {
			res.render('chat', {
				title: "Global Trade Connect",
				categories: results.categories,
				bottomCategory: bottomCategory,
				LoggedInUser: LoggedInUser
			});
		} else {
			res.render('chat', error);
		}
	});
}