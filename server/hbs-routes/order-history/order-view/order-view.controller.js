'use strict';

const async = require('async');
const _ = require('lodash');
const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const reference = require('../../../config/model-reference');
const orderStatusCode = require('../../../config/order_status');
const status = require('../../../config/status');
const marketplace = require('../../../config/marketplace');
const service = require('../../../api/service');
const orderItemStatus = require("../../../config/order-item-new-status");
const orderService = require('../../../api/order/order.service');
const cartService = require('../../../api/cart/cart.service');
const cartObj = require('../../../api/cart/cart.controller');
const populate = require('../../../utilities/populate');
const carriersCode = require('../../../config/carriers');

export function orderView(req, res) {
	var queryObj = {};
	var includeArray = [];
	var bottomCategory = {};
	var orderID = req.params.id;
	var LoggedInUser = req.user;
	var categoryModel = "Category";

	queryObj['id'] = orderID;
	queryObj['user_id'] = req.user.id;

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
		order: function(callback) {
			orderService.userOrderDeatils(queryObj)
				.then((response) => {
					return callback(null, response);
				}).catch((error) => {
					console.log("order Error:::", error);
					return callback(error);
				});
		}
	}, function(error, results) {
		if (!error && results) {
			return res.render('orderView', {
				title: "Global Trade Connect",
				categories: results.categories,
				bottomCategory: bottomCategory,
				LoggedInUser: LoggedInUser,
				cart: results.cartInfo,
				order: results.order,
				orderItemStatus: orderItemStatus,
				marketPlace: marketplace
			});
		} else {
			return res.render('orderView', error);
		}
	});
}

export function trackOrderItem(req, res) {
	var bottomCategory = {};
	var LoggedInUser = req.user;
	var orderID = req.params.id;
	var categoryModel = "Category";
	var orderItemId = req.params.orderItemId;

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
		trackOrderItem: function(callback) {
			orderService.trackOrderItem(orderID, orderItemId, req.user.id)
				.then((item) => {
					return callback(null, item);
				}).catch((error) => {
					console.log("trackOrderItem Error:::", error);
					return callback(error);
				});
		}
	}, function(error, results) {
		if (!error && results) {
			return res.render("order-item-track", {
				title: "Global Trade Connect",
				categories: results.categories,
				bottomCategory: bottomCategory,
				LoggedInUser: LoggedInUser,
				cart: results.cartInfo,
				item: results.trackOrderItem
			});
		} else {
			return res.return("order-item-track", error);
		}
	});
}