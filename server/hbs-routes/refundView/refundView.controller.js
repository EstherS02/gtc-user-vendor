'use strict';
const model = require('../../sqldb/model-connect');
const service = require('../../api/service');
const statusCode = require('../../config/status');
const async = require('async');
const vendorPlan = require('../../config/gtc-plan');
const cartService = require('../../api/cart/cart.service');
const notifictionService = require('../../api/notification/notification.service');
const orderItemStatusCode = require('../../config/order-item-new-status');
const querystring = require('querystring');

export function refund(req, res) {

	var LoggedInUser = {},
		bottomCategory = {},
		queryURI = {}, queryObj = {}, queryPaginationObj = {};
	var offset, limit, field, order, page, maxSize;
	var includeArr = [];

	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	queryPaginationObj['offset'] = offset;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;
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

	field = "id";

	if (req.user)
		LoggedInUser = req.user;

	includeArr = [
		{
			model: model['Product'],
			attributes: ['id', 'product_name', 'vendor_id'],
			include: [
				{
					model: model['Vendor'],
					attributes: ['id', 'vendor_name']
				}
			]
		},
		{
			model: model['Order'],
			include: [
				{
					model: model['User'],
					attributes: ['id', 'first_name', 'last_name']
				},
				{
					model: model['OrderVendor'],
					attributes: ['id', 'vendor_id'],
					where: {
						vendor_id: LoggedInUser.Vendor.id
					}
				}
			],
			attributes: ['id', 'user_id'],
		}
	]

	if (req.query.keyword) {
		queryURI['keyword'] = req.query.keyword;
		queryObj['order_id'] = req.query.keyword;
	}

	if (req.query.status) {
		queryURI['status'] = req.query.status;
		queryObj['order_item_status'] = orderItemStatusCode[req.query.status];

	} else {

		queryObj['$or'] = [{
			order_item_status: orderItemStatusCode['REQUEST_FOR_RETURN']
		}, {
			order_item_status: orderItemStatusCode['APPROVED_REQUEST_FOR_RETURN']
		}, {
			order_item_status: orderItemStatusCode['RETURN_RECIVED']
		}, {
			order_item_status: orderItemStatusCode['REFUND']
		},{
			order_item_status: orderItemStatusCode['CANCELED']
		},{
			order_item_status: orderItemStatusCode['VENDOR_CANCELED']
		},{
			order_item_status: orderItemStatusCode['AUTO_CANCELED']
		}];
	}

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
		unreadCounts: function(callback) {
			notifictionService.notificationCounts(LoggedInUser.id)
				.then(function(counts) {
					return callback(null, counts);
				}).catch(function(error) {
					return callback(null);
				});
		},
		refunds: function(callback) {
			service.findAllRows('OrderItem', includeArr,queryObj, offset, limit, field, order)
				.then(function(refunds) {
					return callback(null, refunds);
				}).catch(function(error) {
					console.log("Error:::", error);
					return callback(null);
				})
		}

	}, function(err, results) {
		if (!err) {
			maxSize = results.refunds.count / limit;
			if (results.refunds.count % limit)
				maxSize++;

			queryPaginationObj['maxSize'] = maxSize;

			res.render('vendorNav/refundView', {
				title: "Global Trade Connect",
				cart: results.cartInfo,
				categories: results.categories,
				bottomCategory: bottomCategory,
				LoggedInUser: LoggedInUser,
				unreadCounts: results.unreadCounts,
				refunds: results.refunds,
				maxSize: 5,
				LoggedInUser: LoggedInUser,
				orderItemStatusCode: orderItemStatusCode,
				queryURI: queryURI,
				queryParamsString: querystring.stringify(queryURI),
				queryPaginationObj: queryPaginationObj,
				vendorPlan: vendorPlan
			});
		} else {
			res.render('vendorNav/refundView', err);
		}
	});
}