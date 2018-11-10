'use strict';

const async = require('async');
const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const status = require('../../../config/status');
const service = require('../../../api/service');
const vendorPlan = require('../../../config/gtc-plan');
const mailStatus = require('../../../config/mail-status');
const cartService = require('../../../api/cart/cart.service');
const marketplace = require('../../../config/marketplace');
const notifictionService = require('../../../api/notification/notification.service');

export function deleted(req, res) {
	var LoggedInUser = {},
		bottomCategory = {},
		queryURI = {},
		queryPaginationObj = {};
	var offset, limit, field, order, page, maxSize, includeArray = [];

	offset = 0;
	limit = null;
	field = "deleted_at";
	order = "desc";
	var mailModel = 'UserMail';

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
		mail_status: mailStatus["DELETED"],
		status: status["ACTIVE"],
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
				
				categoryQueryObj['status'] = status["ACTIVE"];
	
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
			deletedMail: function(callback) {

				includeArray = [{
					"model": model['Mail'],
					where: {
						status: status["ACTIVE"],
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
			maxSize = results.deletedMail.count / limit;
			if (results.deletedMail.count % limit)
				maxSize++;

			queryPaginationObj['maxSize'] = maxSize;

			if (!err) {
				var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
				var dropDownUrl = fullUrl.replace(req.url, '').replace(req.protocol + '://' + req.get('host'), '').replace('/', '');
				res.render('gtc-mail/deleted', {
					title: "Global Trade Connect",
					LoggedInUser: LoggedInUser,
					categories: results.categories,
					bottomCategory: bottomCategory,
					cart: results.cartInfo,
					marketPlace: marketplace,
					deletedMail: results.deletedMail.rows,
					collectionSize: results.deletedMail.count,
					unreadCounts: results.unreadCounts,
					page: page,
					pageSize: limit,
					maxSize: 5,
					selectedPage: 'deleted',
					vendorPlan: vendorPlan,
					dropDownUrl: dropDownUrl,
					queryPaginationObj: queryPaginationObj,
					queryURI: queryURI
				});
			} else {
				res.render('gtc-mail/deleted', err);
			}
		});
}