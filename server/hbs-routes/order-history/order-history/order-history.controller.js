'use strict';

const async = require('async');
const moment = require('moment');
const sequelize = require('sequelize');
const querystring = require('querystring');
const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const statusCode = require('../../../config/status');
const service = require('../../../api/service');
const orderService = require('../../../api/order/order.service');
const marketplace = require('../../../config/marketplace');
const cartService = require('../../../api/cart/cart.service');
const vendorPlan = require('../../../config/gtc-plan');
const notifictionService = require('../../../api/notification/notification.service');

export function orderHistory(req, res) {
	
	var queryObj = {};
	var queryParams = {};
	var bottomCategory = {};
	var LoggedInUser = req.user;
	var categoryModel = "Category";
	var dateRangeOptions = [{
		"column": "Today",
		"value": 1
	}, {
		"column": "Yesterday",
		"value": 2
	}, {
		"column": "Last 7 Days",
		"value": 3
	}, {
		"column": "Last 30 Days",
		"value": 4
	}, {
		"column": "This Month",
		"value": 5
	}, {
		"column": "Last Month",
		"value": 6
	}];

	queryObj['user_id'] = req.user.id;

	if (req.query.range) {
		queryParams['range'] = req.query.range;
	} else {
		queryParams['range'] = 5;
	}

	if (queryParams['range'] == 5) {
		queryParams['start_date'] = moment().startOf('month').format('MM/DD/YYYY');
		queryParams['end_date'] = moment().endOf('month').format('MM/DD/YYYY');
	} else {
		if (req.query.start_date) {
			queryParams['start_date'] = req.query.start_date;
		}
		if (req.query.end_date) {
			queryParams['end_date'] = req.query.end_date;
		}
	}

	if (queryParams['start_date'] && queryParams['end_date']) {
		queryObj['ordered_date'] = {
			'$gte': moment(queryParams['start_date'], 'MM/DD/YYYY').startOf('day').format("YYYY-MM-DD HH:mm:ss"),
			'$lte': moment(queryParams['end_date'], 'MM/DD/YYYY').endOf('day').format("YYYY-MM-DD HH:mm:ss")
		};
	}

	if (req.query.status) {
		queryParams['status'] = req.query.status;
		queryObj['status'] = queryParams['status'];
	}

	if (req.query.query) {
		queryParams['query'] = req.query.query;
		queryObj['id'] = {
			like: '%' + queryParams['query'] + '%'
		}
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
		personalOrderHistory: function(callback) {
			var offset = 0;
			var order = "DESC";
			var includeArray = [];
			var field = "ordered_date";
			var orderModelName = "Order";
			var limit = req.query.limit ? parseInt(req.query.limit) : 10;
			var offset = req.query.offset ? parseInt(req.query.offset) : 0;
			var page = req.query.page ? parseInt(req.query.page) : 1;

			queryParams['page'] = page;
			queryParams['limit'] = limit;
			offset = (page - 1) * limit;

			includeArray = [{
				model: model['Payment'],
				attributes: ['id', 'amount', 'payment_method', 'status']
			}];

			orderService.findAllOrders(orderModelName, includeArray, queryObj, offset, limit, field, order)
				.then((response) => {
					return callback(null, response);
				}).catch((error) => {
					console.log("Error :::", error);
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
		if (!error && results) {
			return res.render('userNav/order-history', {
				title: "Global Trade Connect",
				categories: results.categories,
				bottomCategory: bottomCategory,
				LoggedInUser: LoggedInUser,
				cart: results.cartInfo,
				marketPlace: marketplace,
				orders: results.personalOrderHistory,
				unreadCounts: results.unreadCounts,
				queryParams: queryParams,
				queryParamsString: querystring.stringify(queryParams),
				dateRangeOptions: dateRangeOptions,
				vendorPlan:vendorPlan
			});
		} else {
			return res.render('userNav/order-history', error);
		}
	});
}