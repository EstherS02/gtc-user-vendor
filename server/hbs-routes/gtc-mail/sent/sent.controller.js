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

export function sent(req, res) {
	var LoggedInUser = {},
		queryPaginationObj = {},
		bottomCategory = {},
		queryURI = {};
	var offset, limit, field, order, page, maxSize, includeArray = [];

	offset = 0;
	limit = null;
	field = "created_on";
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
		mail_status: mailStatus["SENT"],
		status: statusCode["ACTIVE"]
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
			sentMail: function(callback) {

				includeArray = [{
					"model": model['Mail'],
					where: {
						status: statusCode["ACTIVE"],
						//from_id : user_id	
					},
					include: [{
						model: model['User'],
						as: 'toUser',
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
					sentMail: results.sentMail.rows,
					collectionSize: results.sentMail.count,
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