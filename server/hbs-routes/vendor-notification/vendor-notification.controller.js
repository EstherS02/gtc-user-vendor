'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
var async = require('async');
const vendorPlan = require('../../config/gtc-plan');
const mailStatus = require('../../config/mail-status');
const cartService = require('../../api/cart/cart.service');
const marketplace = require('../../config/marketplace');

export function notificationSettings(req, res) {
	var LoggedInUser = {};
	var bottomCategory = {};

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;
	if (req.user.Vendor.id) {
		//pagination 
		var page;
		var offset;
		var limit;
		var order = "asc";
		var field = "id";
		var modelName = 'VendorNotification';
		var queryObj = {};
		var includeArr = [{
			model: model["VendorNotificationSetting"],
			where: {
				vendor_id: req.user.Vendor.id
			},
			required: false
		}];

		var queryObjCategory = {
			status: statusCode['ACTIVE']
		};

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
			notifications: function(callback) {
				service.findRows(modelName, queryObj, 0, null, field, order, includeArr)
					.then(function(results) {
						return callback(null, results);

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

			}
		}, function(err, results) {
			if (!err) {
				res.render('vendorNav/notifications-settings', {
					title: "Global Trade Connect",
					title: "Global Trade Connect",
					// count: results.notifications.count,
					notification: results.notifications.rows,
					categories: results.categories,
					bottomCategory: bottomCategory,
					cart: results.cartInfo,
					marketPlace: marketplace,
					LoggedInUser: LoggedInUser,
					selectedPage: 'notifications_settings',
					vendorPlan: vendorPlan,
					statusCode:statusCode
				});
			} else {
				res.render('notifications', err);
			}

		});
	}
}

function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}

export function notifications(req, res) {
	var LoggedInUser = {};
	var bottomCategory = {};
	var offset, limit, field, order, page, includeArray = [];

	offset = 0;
	limit = null;
	field = "created_on";
	order = "desc";
	var mailModel = 'UserMail';

	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : config.paginationLimit;
	delete req.query.limit;

	page = req.query.page ? parseInt(req.query.page) : 1;
	delete req.query.page;

	offset = (page - 1) * limit;


	if (req.user)
		LoggedInUser = req.user;

	var user_id = LoggedInUser.id;

	var queryObj = {
		user_id: user_id,
		mail_status: mailStatus["UNREAD"],
		status: statusCode["ACTIVE"],
	};

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
			},
			inboxMail: function(callback) {

				includeArray = [{
					"model": model['Mail'],
					where: {
						status: statusCode["ACTIVE"],
						//to_id : user_id	
					},
					include: [{
						model: model['User'],
						as: 'fromUser',
						attributes: ['id', 'first_name']
					}],
				}];

				service.findRows(mailModel, queryObj, offset, limit, field, order, includeArray)
					.then(function(mail) {
						return callback(null, mail);

					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(null);
					});
			}
		},
		function(err, results) {
			if (!err) {
				var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
				var dropDownUrl = fullUrl.replace(req.url, '').replace(req.protocol + '://' + req.get('host'), '').replace('/', '');
				res.render('vendorNav/notifications', {
					title: "Global Trade Connect",
					LoggedInUser: LoggedInUser,
					categories: results.categories,
					bottomCategory: bottomCategory,
					cart: results.cartInfo,
					marketPlace: marketplace,
					inboxMail: results.inboxMail.rows,
					mailStatus: mailStatus,
					collectionSize: results.inboxMail.count,
					page: page,
					pageSize: limit,
					maxSize: 5,
					selectedPage: 'notifications',
					vendorPlan: vendorPlan,
					dropDownUrl: dropDownUrl,
					statusCode: statusCode
				});
			} else {
				res.render('vendorNav/notifications', err);
			}
		});
}