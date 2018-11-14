'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const async = require('async');
const vendorPlan = require('../../config/gtc-plan');
const cartService = require('../../api/cart/cart.service');
const marketplace = require('../../config/marketplace');
const notifictionService = require('../../api/notification/notification.service');

export function termsAndCond(req, res) {
	var LoggedInUser = {},
		termsAndCondQueryObj = {};
	var bottomCategory = {};
	var termsAndCondModel = 'TermsAndCond'

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;
	var queryObjCategory = {
		status: statusCode['ACTIVE']
	};
	async.series({
			cartInfo: function(callback) {
				if (LoggedInUser.id) {
					cartService.cartCalculation(LoggedInUser.id, req, res)
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

			},
			termsAndCond: function(callback) {

				termsAndCondQueryObj['vendor_id'] = LoggedInUser.Vendor.id;
				termsAndCondQueryObj['status'] = statusCode['ACTIVE'];

				service.findOneRow(termsAndCondModel, termsAndCondQueryObj, [])
					.then(function(termsAndCond) {
						return callback(null, termsAndCond);
					})
					.catch(function(error) {
						consolelog('Error:::', error);
						return callback(error, null);
					});
			},
			unreadCounts: function(callback) {
				notifictionService.notificationCounts(user_id)
					.then(function(counts) {
						return callback(null, counts);
					}).catch(function(error) {
						return callback(null);
					});
			}
		},
		function(err, results) {
			if (!err) {
				res.render('vendorNav/terms-and-cond', {
					title: "Global Trade Connect",
					LoggedInUser: LoggedInUser,
					categories: results.categories,
					bottomCategory: bottomCategory,
					cart: results.cartInfo,
					marketPlace: marketplace,
					selectedPage: 'terms-and-conditions',
					vendorPlan: vendorPlan,
					termsAndCond: results.termsAndCond,
					unreadCounts: results.unreadCounts,
					statusCode: statusCode
				});
			} else {
				res.render('vendorNav/terms-and-cond', err);
			}
		});
}