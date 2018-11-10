'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const marketplace = require('../../config/marketplace');
const cartService = require('../../api/cart/cart.service');
const async = require('async');
const verificationStatus = require('../../config/verification_status');
const vendorPlan = require('../../config/gtc-plan');
const notifictionService = require('../../api/notification/notification.service');

export function verification(req, res) {
	var LoggedInUser = {};
	var bottomCategory = {};

	if (req.user)
		LoggedInUser = req.user;
	let user_id = LoggedInUser.id;

	var modelName = "VendorVerification";
	var queryObj = {};

	let vendor_id = LoggedInUser.Vendor.id;


	queryObj = {
		vendor_id: vendor_id
	};
	var includeArr = [];

	async.series({
			cartInfo: function(callback) {
				cartService.cartCalculation(LoggedInUser.id, req, res)
					.then((cartResult) => {
						return callback(null, cartResult);
					}).catch((error) => {
						return callback(error);
					});
			},
			verification: function(callback) {
				service.findOneRow(modelName, queryObj, includeArr)
					.then(function(response) {
						if (response) {
							return callback(null, response);
						} else {
							return callback(null, null);
						}
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
				res.render('vendorNav/verification', {
					title: "Global Trade Connect",
					verification: results.verification,
					LoggedInUser: LoggedInUser,
					statusCode: statusCode,
					categories: results.categories,
					bottomCategory: bottomCategory,
					verificationStatus: verificationStatus,
					cart: results.cartInfo,
					unreadCounts: results.unreadCounts,
					marketPlace: marketplace,
					vendorPlan: vendorPlan,
					selectedPage: 'gtc-verification',
				});
			} else {
				res.render('vendorNav/verification', err);
			}
		});

}