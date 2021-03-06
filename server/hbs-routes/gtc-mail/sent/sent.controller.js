'use strict';

const async = require('async');
const _ = require('lodash');
const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const reference = require('../../../config/model-reference');
const statusCode = require('../../../config/status');
const service = require('../../../api/service');
const populate = require('../../../utilities/populate');
const vendorPlan = require('../../../config/gtc-plan');
const mailStatus = require('../../../config/mail-status');
const cartService = require('../../../api/cart/cart.service');
const marketplace = require('../../../config/marketplace');
const notifictionService = require('../../../api/notification/notification.service');
const mailService = require('../../../api/mail/mail.service');

export function sent(req, res) {
	var LoggedInUser = {},
		queryPaginationObj = {},
		bottomCategory = {},
		queryObj = {},
		queryURI = {},
		mailArray = [];

	var offset, limit, field, order, page, maxSize, includeArray = [];

	offset = 0;
	limit = null;
	field = "created_on";
	order = "desc";

	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	queryPaginationObj['offset'] = offset;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;
	queryPaginationObj['limit'] = limit;
	delete req.query.limit;
	order = req.query.order ? req.query.order : "desc";
	queryPaginationObj['order'] = order;
	delete req.query.order;
	page = req.query.page ? parseInt(req.query.page) : 1;
	queryPaginationObj['page'] = page;
	delete req.query.page;

	offset = (page - 1) * limit;

	if (req.user)
		LoggedInUser = req.user;

	var user_id = LoggedInUser.id;

	var queryObj = {
		user_id: user_id,
		mail_status: mailStatus["SENT"],
		status: statusCode["ACTIVE"]
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
			sentMail: function(callback) {
				includeArray = [{
					"model": model['Mail'],
					where: {
						status: statusCode["ACTIVE"]
					}
				}];

				service.findRows('UserMail', queryObj, offset, limit, field, order, includeArray)
					.then(function(mail) {
						mailArray = JSON.parse(JSON.stringify(mail.rows));
						return callback(null, mail);
					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(null);
					});
			},
			mailArray: function(callback) {
				if (mailArray.length > 0) {
					mailService.sentMailDetails(mailArray)
					.then(function(mailRes) {
						return callback(null, mailRes);
					}).catch(function(error) {
						return callback(null, []);
					})
				} else {
					return callback(null, []);
				}
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

			maxSize = results.sentMail.count / limit;
			if (results.sentMail.count % limit)
				maxSize++;

			queryPaginationObj['maxSize'] = maxSize;

			if (!err) {
				var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
				var dropDownUrl = fullUrl.replace(req.url, '').replace(req.protocol + '://' + req.get('host'), '').replace('/', '');
				res.render('gtc-mail/sent', {
					title: "Global Trade Connect",
					LoggedInUser: LoggedInUser,
					categories: results.categories,
					bottomCategory: bottomCategory,
					cart: results.cartInfo,
					marketPlace: marketplace,
					sentMail: results.mailArray,
					collectionSize: results.sentMail.count,
					unreadCounts: results.unreadCounts,
					page: page,
					pageSize: limit,
					maxSize: 5,
					selectedPage: 'sent',
					vendorPlan: vendorPlan,
					dropDownUrl: dropDownUrl,
					queryPaginationObj: queryPaginationObj,
					queryURI: queryURI
				});
			} else {
				res.render('gtc-mail/sent', err);
			}
		});
}