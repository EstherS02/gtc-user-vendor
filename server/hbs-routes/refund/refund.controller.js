'use strict';
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../../api/service');
const statusCode = require('../../config/status');
const sequelize = require('sequelize');
const moment = require('moment');
const populate = require('../../utilities/populate');
var async = require('async');
const vendorPlan = require('../../config/gtc-plan');
const orderItemStatus = require('../../config/order-item-status');
const cartService = require('../../api/cart/cart.service');
const marketplace = require('../../config/marketplace');

export function refund(req, res) {

	var queryObj = {},
		LoggedInUser = {},
		bottomCategory = {};
	var orderIncludeArr = [];

	var offset, limit, field, order;
	offset = 0;
	limit = null;
	field = "id";
	order = "asc";

	var orderModel = "Order";

	if (req.user)
		LoggedInUser = req.user;

	orderIncludeArr = [{
		model: model['OrderItem'],
		include: [{
			model: model['Product'],
			include: [{
				model: model['ProductMedia']
			}, {
				model: model['Vendor'],
				include: [{
					model: model['TermsAndCond']
				}]
			}]
		}]
	}, {
		model: model['Shipping']
	}];

	if (req.params.id)
		queryObj["id"] = req.params.id;

	queryObj["status"] = statusCode.ACTIVE;

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
		order: function(callback) {
			service.findOneRow(orderModel, queryObj, orderIncludeArr)
				.then(function(order) {
					return callback(null, order);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
	}, function(err, results) {
		if (!err) {
			res.render('refund', {
				title: "Global Trade Connect",
				order: results.order,
				categories: results.categories,
				bottomCategory: bottomCategory,
				LoggedInUser: LoggedInUser,
				cart: results.cartInfo,
				marketPlace: marketplace,
				vendorPlan: vendorPlan,
				orderItemStatus: orderItemStatus
			});
		} else {
			res.render('refund', err);
		}
	});
}