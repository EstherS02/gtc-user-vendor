'use strict';

const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const statusCode = require('../../../config/status');
const service = require('../../../api/service');
const async = require('async');
const vendorPlan = require('../../../config/gtc-plan');
const mailStatus = require('../../../config/mail-status');
const cartService = require('../../../api/cart/cart.service');
const marketplace = require('../../../config/marketplace');
const notifictionService = require('../../../api/notification/notification.service');

export function mailSettings(req, res) {
	var LoggedInUser = {}, bottomCategory = {}, queryObj = {}, queryObjCategory ={};
	var includeArr = [];
	var user_id;

	if (req.user)
		LoggedInUser = req.user;

	user_id = LoggedInUser.id;

	if (req.user.Vendor.id) {

		var page, offset, limit, order, field;

		order = "asc";
		field = "id";

		includeArr = [{
			model: model["VendorNotificationSetting"],
			where: {
				vendor_id: req.user.Vendor.id
			},
			required: false
		}];

		queryObjCategory = {
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
			notifications: function(callback) {
				service.findRows('VendorNotification', queryObj, 0, null, field, order, includeArr)
					.then(function(results) {
						return callback(null, results);

					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(null);
					});
			},
			categories: function(callback) {
				var includeArr = [];
				var categoryOffset, categoryLimit, categoryField, categoryOrder;
				var categoryQueryObj = {};
	
				categoryOffset = 0;
				categoryLimit = null;
				categoryField = "id";
				categoryOrder = "asc";
				
				categoryQueryObj['status'] = statusCode["ACTIVE"];
	
				service.findAllRows('Category', includeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
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
		}, function(err, results) {
			if (!err) {
				var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
				var dropDownUrl = fullUrl.replace(req.url, '').replace(req.protocol + '://' + req.get('host'), '').replace('/', '');
				res.render('gtc-mail/mail-settings', {
					title: "Global Trade Connect",
					notification: results.notifications.rows,
					categories: results.categories,
					bottomCategory: bottomCategory,
					cart: results.cartInfo,
					unreadCounts: results.unreadCounts,
					marketPlace: marketplace,
					LoggedInUser: LoggedInUser,
					selectedPage: 'mail-settings',
					vendorPlan: vendorPlan,
					dropDownUrl: dropDownUrl
				});
			} else {
				res.render('gtc-mail/mail-settings', err);
			}

		});
	}
}