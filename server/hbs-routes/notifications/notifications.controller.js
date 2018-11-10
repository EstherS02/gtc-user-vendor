'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const async = require('async');
const vendorPlan = require('../../config/gtc-plan');
const mailStatus = require('../../config/mail-status');
const cartService = require('../../api/cart/cart.service');
const marketplace = require('../../config/marketplace');
const notifictionService = require('../../api/notification/notification.service');

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
	var NotifyModel = 'Notification';

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
	var NotifyqueryObj = {
		user_id: user_id,
		deleted_at: null,
		//is_read: 1,
		status: statusCode["ACTIVE"],
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
			notifications: function(callback) {
				includeArray = [];
				service.findAllRows(NotifyModel, includeArray, NotifyqueryObj, offset, limit, field, order)
					.then(function(notification) {
						return callback(null, notification);
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
					unreadCounts: results.unreadCounts,
					mailStatus: mailStatus,
					collectionSize: results.inboxMail.count + results.notifications.count,
					notifications: results.notifications.rows,
					page: page,
					pageSize: limit,
					maxSize: 5,
					selectedPage: 'notifications',
					vendorPlan: vendorPlan,
					dropDownUrl: dropDownUrl
				});
			} else {
				res.render('vendorNav/notifications', err);
			}
		});
}