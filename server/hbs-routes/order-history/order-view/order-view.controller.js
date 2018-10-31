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
		order: function(callback) {
			orderService.userOrder(queryObj)
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

export function orderViewOld(req, res) {
	var LoggedInUser = {},
		bottomCategory = {},
		searchObj = {},
		itemIncludeArr = [],
		orderIncludeArr = [];
	var order_id;
	var marketPlaceModel = 'Marketplace';
	var orderItemsModel = 'OrderItem';
	var orderModel = 'Order';
	var categoryModel = "Category";

	if (req.user)
		LoggedInUser = req.user;

	itemIncludeArr = populate.populateData('Product,Product.Marketplace,Order');
	orderIncludeArr = populate.populateData('Shipping');

	async.series({
		cartCounts: function(callback) {
			service.cartHeader(LoggedInUser).then(function(response) {
				return callback(null, response);
			}).catch(function(error) {
				console.log('Error :::', error);
				return callback(null);
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
					return callback(null);
				});
		},

		order: function(cb) {
			if (req.params.id)
				var id = req.params.id;

			return service.findIdRow(orderModel, id, orderIncludeArr)
				.then(function(order) {
					return cb(null, order)
				}).catch(function(error) {
					console.log('Error :::', error);
					return cb(error);
				})
		},
		orderItems: function(cb) {

			var queryObj = {};
			let includeArr = [];

			if (req.params.id)
				queryObj["order_id"] = req.params.id;

			queryObj['status'] = {
				'$eq': status["ACTIVE"]
			}

			return model["OrderItem"].findAndCountAll({
				where: queryObj,
				include: [{
					model: model["Order"],
				}, {
					model: model["Product"],
					include: [{
						model: model["Vendor"]
					}, {
						model: model["Category"]
					}, {
						model: model["SubCategory"]
					}, {
						model: model["Marketplace"]
					}, {
						model: model["MarketplaceType"]
					}, {
						model: model["Country"]
					}, {
						model: model["State"]
					}, {
						model: model["ProductMedia"],
						where: {
							base_image: 1,
							status: {
								'$eq': status["ACTIVE"]
							}
						}
					}]
				}]
			}).then(function(data) {
				var result = JSON.parse(JSON.stringify(data));
				return cb(null, result)
			}).catch(function(error) {
				console.log('Error:::', error);
				return cb(error);
			});
		},
		marketPlace: function(cb) {

			var searchObj = {};
			let includeArr = [];

			searchObj['status'] = {
				'$eq': status["ACTIVE"]
			}
			return service.findRows(marketPlaceModel, searchObj, null, null, 'created_on', "asc", includeArr)
				.then(function(marketPlaceData) {
					marketPlaceData = JSON.parse(JSON.stringify(marketPlaceData));
					return cb(null, marketPlaceData)
				}).catch(function(error) {
					console.log('Error :::', error);
					return cb(error);
				});
		},
	}, function(err, results) {
		if (!err) {
			var totalItems = results.orderItems.rows;
			var allMarketPlaces = results.marketPlace.rows;
			var totalPrice = {};
			var defaultShipping = 0;

			totalPrice['grandTotal'] = 0;

			var seperatedItems = _.groupBy(totalItems, "Product.Marketplace.code");

			_.forOwn(seperatedItems, function(itemsValue, itemsKey) {
				totalPrice[itemsKey] = {};
				totalPrice[itemsKey]['price'] = 0;
				totalPrice[itemsKey]['shipping'] = 0;
				totalPrice[itemsKey]['total'] = 0;

				for (var i = 0; i < itemsValue.length; i++) {

					if ((itemsKey == itemsValue[i].Product.Marketplace.code) && itemsValue[i].Product.price) {

						var calulatedSum = (itemsValue[i].quantity * itemsValue[i].Product.price);

						totalPrice[itemsKey]['price'] = totalPrice[itemsKey]['price'] + calulatedSum;
						totalPrice[itemsKey]['shipping'] = totalPrice[itemsKey]['shipping'] + defaultShipping;
						totalPrice[itemsKey]['total'] = totalPrice[itemsKey]['price'] + totalPrice[itemsKey]['shipping'];
					}
				}

				totalPrice['grandTotal'] = totalPrice['grandTotal'] + totalPrice[itemsKey]['total'];
			});

			var result_obj = {
				title: "Global Trade Connect",
				LoggedInUser: LoggedInUser,
				marketPlaces: results.marketPlace.rows,
				order: results.order,
				orderItems: results.orderItems.rows,
				orderItemsCount: results.orderItems.count,
				seperatedItemsList: seperatedItems,
				totalPriceList: totalPrice,
				orderStatusCode: orderStatusCode,
				categories: results.categories,
				cartheader: results.cartCounts,
				bottomCategory: bottomCategory,
				carriersCode: carriersCode
			}
			return res.status(200).render('orderView', result_obj);
		} else {
			res.render('orderView', err);
		}
	});
}