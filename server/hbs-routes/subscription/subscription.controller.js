'use strict';

const async = require('async');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const vendorPlan = require('../../config/gtc-plan');
const cartService = require('../../api/cart/cart.service');
const marketplace = require('../../config/marketplace');
const populate = require('../../utilities/populate');
const notifictionService = require('../../api/notification/notification.service');
const querystring = require('querystring');

export function subscriptions(req, res) {

	var LoggedInUser = {},
		subscriptionQueryObj = {},
		queryURI = {},
		queryPaginationObj = {},
		bottomCategory = {};
	var subscriptionIncludeArr = []
	var offset, limit, field, order, page, maxSize;

	field = 'id';
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	queryPaginationObj['offset'] = offset;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : config.paginationLimit;
	queryPaginationObj['limit'] = limit;
	queryURI['limit'] = limit;
	delete req.query.limit;
	order = req.query.order ? req.query.order : "desc";
	queryPaginationObj['order'] = order;
	delete req.query.order;
	page = req.query.page ? parseInt(req.query.page) : 1;
	queryPaginationObj['page'] = page;
	queryURI['page'] = page;
	delete req.query.page;

	offset = (page - 1) * limit;

	if (req.user)
		LoggedInUser = req.user;

	subscriptionQueryObj['user_id'] = LoggedInUser.id

	subscriptionIncludeArr = [
		{
			model: model['Product'],
			include:[{
				model: model['ProductMedia']
			}]
		}
	]

	if (req.query.status) {
		queryURI['status'] = req.query.status;
		subscriptionQueryObj['status'] = statusCode[req.query.status]
	}

	if (req.query.keyword) {
		queryURI['keyword'] = req.query.keyword;
		subscriptionIncludeArr = [{
			model: model["Product"],
			where: {
				product_name: {
					like: '%' + req.query.keyword + '%'
				}
			}
		}]
	}

	async.series({
		cartInfo: function(callback) {
			cartService.cartCalculation(LoggedInUser.id, req, res)
				.then((cartResult) => {
					return callback(null, cartResult);
				}).catch((error) => {
					return callback(error);
				});
		},
		categories: function(callback) {
			var includeArr = [];
			const categoryOffset = 0;
			const categoryLimit = null;
			const categoryField = "id";
			const categoryOrder = "asc";
			const categoryQueryObj = {};

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
		subscriptions: function(callback) {
			service.findRows('Subscription', subscriptionQueryObj, offset, limit, field, order, subscriptionIncludeArr)
				.then(function(subscriptions) {
					return callback(null, subscriptions);
				}).catch(function(error) {
					return callback(error);
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
	}, function(error, results) {
		if (!error) {
			maxSize = results.subscriptions.count / limit;
			if (results.subscriptions.count % limit)
				maxSize++;

			queryPaginationObj['maxSize'] = maxSize;

			res.render('userNav/view-subscription', {
				title: "Global Trade Connect",
				cart: results.cartInfo,
				LoggedInUser: LoggedInUser,
				bottomCategory: bottomCategory,
				categories: results.categories,
				collectionSize: results.subscriptions.count,
				unreadCounts: results.unreadCounts,
				subscriptions: results.subscriptions,
				selectedPage: 'subscription',
				statusCode: statusCode,
				vendorPlan: vendorPlan,
				marketPlace: marketplace,
				queryURI: queryURI,
				queryParamsString: querystring.stringify(queryURI),
				queryPaginationObj: queryPaginationObj,
				pageSize: limit,
				maxSize: 5,
				page: page
			})
		} else {
			res.render('userNav/view-subscription', error);
		}
	});
}