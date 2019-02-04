'use strict';

const _ = require('lodash');
var async = require('async');
const moment = require('moment');
const sequelize = require('sequelize');
const querystring = require('querystring');

const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const reference = require('../../../config/model-reference');
const status = require('../../../config/status');
const service = require('../../../api/service');
const cartService = require('../../../api/cart/cart.service');
const orderService = require('../../../api/order/order.service');
const marketPlace = require('../../../config/marketplace');
const orderStatusCode = require('../../../config/order_status');
const orderItemStatus = require("../../../config/order-item-new-status");
const vendorPlan = require('../../../config/gtc-plan');
const carriersCode = require('../../../config/carriers');
const populate = require('../../../utilities/populate');
const notifictionService = require('../../../api/notification/notification.service');

export function salesHistory(req, res) {
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

	queryObj['vendor_id'] = req.user.Vendor.id;

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
		queryObj['created_on'] = {
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
		queryObj['order_id'] = {
			like: '%' + queryParams['query'] + '%'
		}
	}

	async.series({
		cartInfo: function(callback) {
			cartService.cartCalculation(LoggedInUser.id, req, res)
				.then((cartResult) => {
					return callback(null, cartResult);
				}).catch((error) => {
					console.log("cartInfo Error:::", error);
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

			categoryQueryObj['status'] = status["ACTIVE"];

			service.findAllRows(categoryModel, includeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
				.then(function(category) {
					var categories = category.rows;
					bottomCategory['left'] = categories.slice(0, 8);
					bottomCategory['right'] = categories.slice(8, 16);
					return callback(null, category.rows);
				}).catch(function(error) {
					console.log('categories Error:::', error);
					return callback(null);
				});
		},
		vendorOrderHistory: function(callback) {
			var offset = 0;
			var order = "DESC";
			var includeArray = [];
			var field = "created_on";
			var orderVendorModelName = "OrderVendor";
			var limit = req.query.limit ? parseInt(req.query.limit) : 10;
			var offset = req.query.offset ? parseInt(req.query.offset) : 0;
			var page = req.query.page ? parseInt(req.query.page) : 1;

			queryParams['page'] = page;
			queryParams['limit'] = limit;
			offset = (page - 1) * limit;

			includeArray = [{
				model: model["Order"],
				attributes: ['id', 'ordered_date', 'status']
			}];

			orderService.findAllOrders(orderVendorModelName, includeArray, queryObj, offset, limit, field, order)
				.then((response) => {
					return callback(null, response);
				}).catch((error) => {
					console.log("vendorOrderHistory Error :::", error);
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
			return res.render('vendorNav/reporting/sales-history', {
				title: "Global Trade Connect",
				categories: results.categories,
				bottomCategory: bottomCategory,
				LoggedInUser: LoggedInUser,
				cart: results.cartInfo,
				orders: results.vendorOrderHistory,
				unreadCounts: results.unreadCounts,
				queryParams: queryParams,
				queryParamsString: querystring.stringify(queryParams),
				dateRangeOptions: dateRangeOptions,
				vendorPlan :vendorPlan
			});
		} else {
			return res.render('vendorNav/reporting/sales-history', error);
		}
	});
}


export function myOrder(req, res) {
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

	queryObj['vendor_id'] = req.user.Vendor.id;

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
		queryObj['created_on'] = {
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
		queryObj['order_id'] = {
			like: '%' + queryParams['query'] + '%'
		}
	}

	async.series({
		cartInfo: function(callback) {
			cartService.cartCalculation(LoggedInUser.id, req, res)
				.then((cartResult) => {
					return callback(null, cartResult);
				}).catch((error) => {
					console.log("cartInfo Error:::", error);
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

			categoryQueryObj['status'] = status["ACTIVE"];

			service.findAllRows(categoryModel, includeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
				.then(function(category) {
					var categories = category.rows;
					bottomCategory['left'] = categories.slice(0, 8);
					bottomCategory['right'] = categories.slice(8, 16);
					return callback(null, category.rows);
				}).catch(function(error) {
					console.log('categories Error:::', error);
					return callback(null);
				});
		},
		vendorOrderHistory: function(callback) {
			console.log("enter the loops orderHistory::::++++++");
			var offset = 0;
			var order = "DESC";
			var includeArray = [];
			var field = "created_on";
			var orderVendorModelName = "OrderVendor";
			var limit = req.query.limit ? parseInt(req.query.limit) : 10;
			var offset = req.query.offset ? parseInt(req.query.offset) : 0;
			var page = req.query.page ? parseInt(req.query.page) : 1;

			queryParams['page'] = page;
			queryParams['limit'] = limit;
			offset = (page - 1) * limit;

			includeArray = [{
				model: model["Order"],
				attributes: ['id', 'ordered_date', 'status']
			}];

			orderService.findAllOrders(orderVendorModelName, includeArray, queryObj, offset, limit, field, order)
				.then((response) => {
					return callback(null, response);
				}).catch((error) => {
					console.log("vendorOrderHistory Error :::", error);
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
			return res.render('vendorNav/my-orders', {
				title: "Global Trade Connect",
				categories: results.categories,
				bottomCategory: bottomCategory,
				LoggedInUser: LoggedInUser,
				cart: results.cartInfo,
				orders: results.vendorOrderHistory,
				unreadCounts: results.unreadCounts,
				queryParams: queryParams,
				queryParamsString: querystring.stringify(queryParams),
				dateRangeOptions: dateRangeOptions,
				vendorPlan :vendorPlan
			});
		} else {
			return res.render('vendorNav/my-orders', error);
		}
	});
}

export function orderView(req, res) {
	var queryObj = {};
	var includeArray = [];
	var bottomCategory = {};
	var orderID = req.params.id;
	var LoggedInUser = req.user;
	var categoryModel = "Category";

	queryObj['order_id'] = orderID;
	queryObj['vendor_id'] = req.user.Vendor.id;

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

			categoryQueryObj['status'] = status["ACTIVE"];

			service.findAllRows(categoryModel, includeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
				.then(function(category) {
					var categories = category.rows;
					bottomCategory['left'] = categories.slice(0, 8);
					bottomCategory['right'] = categories.slice(8, 16);
					return callback(null, category.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(error);
				});
		},
		orderView: function(callback) {
			orderService.vendorOrderDetails(queryObj)
				.then((response) => {
					return callback(null, response);
				}).catch((error) => {
					console.log("order Error:::", error);
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
			return res.render('vendorNav/vendor-order/vendor-order-view', {
				title: "Global Trade Connect",
				categories: results.categories,
				bottomCategory: bottomCategory,
				LoggedInUser: LoggedInUser,
				cart: results.cartInfo,
				order: results.orderView,
				orderItemStatus: orderItemStatus,
				unreadCounts: results.unreadCounts,
				marketPlace: marketPlace,
				carriersCode: carriersCode
			});
		} else {
			return res.render('vendorNav/vendor-order/vendor-order-view', error);
		}
	});
}

