'use strict';

const model = require('../../../../sqldb/model-connect');
const statusCode = require('../../../../config/status');
const service = require('../../../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');
const marketplace = require('../../../../config/marketplace');
const cartService = require('../../../../api/cart/cart.service');
const orderStatus = require('../../../../config/order_status');
var async = require('async');
const vendorPlan = require('../../../../config/gtc-plan');
const notifictionService = require('../../../../api/notification/notification.service');


export function tax(req, res) {
	var LoggedInUser = {};
	var queryURI = {};
	var categoryModel = "Category";
	var bottomCategory = {};

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;
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
				notifictionService.notificationCounts(LoggedInUser.id)
					.then(function(counts) {
						return callback(null, counts);
					}).catch(function(error) {
						return callback(null);
					});
			}
		},
		function(err, results) {
			var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
			var dropDownUrl = fullUrl.replace(req.url, '').replace(req.protocol + '://' + req.get('host'), '').replace('/', '');

			if (!err) {
				res.render('vendorNav/reporting/tax', {
					title: "Global Trade Connect",
					categories: results.categories,
					unreadCounts: results.unreadCounts,
					bottomCategory: bottomCategory,
					queryURI: queryURI,
					selectedPage: 'tax',
					orderStatus: orderStatus,
					vendorPlan: vendorPlan,
					cart: results.cartInfo,
					marketPlace: marketplace,
					LoggedInUser: LoggedInUser,
					dropDownUrl: dropDownUrl,
					statusCode: statusCode
				});
			} else {
				res.render('vendorNav/reporting/tax', err);
			}
		});
}