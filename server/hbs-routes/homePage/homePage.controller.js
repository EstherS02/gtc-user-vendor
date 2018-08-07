'use strict';

var async = require('async');

const service = require('../../api/service');
const status = require('../../config/status');
const model = require('../../sqldb/model-connect');
const position = require('../../config/position');
const marketplace = require('../../config/marketplace');
const marketplace_type = require('../../config/marketplace_type');
const layout_type=require('../../config/layout_type')
const config = require('../../config/environment');
const _ = require('lodash');

export function homePage(req, res) {
	var productModel = "MarketplaceProduct";
	var vendorModel = "VendorUserProduct";
	var categoryModel = "Category";
	var bottomCategory = {};
	var offset, limit, field, order;
	var queryObj = {};
	var LoggedInUser = {};
	
	offset = 0;
	limit = 5;
	field = "id";
	order = "asc";

	queryObj['status'] = status["ACTIVE"];

	if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable) {
		LoggedInUser = req.gtcGlobalUserObj;
	}

	async.series({
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
		cartItems: function(callback) {

			var queryObj = {};
			let includeArr = [];

			queryObj['user_id'] = LoggedInUser.id;

			queryObj['status'] = {
				'$eq': status["ACTIVE"]
			}
			return model["Cart"].findAndCountAll({
				where: queryObj,
				include: [{
					model: model["Product"],
					attributes: ['id', 'price', 'shipping_cost'],
					include: [{
						model: model["Marketplace"]
					}, {
						model: model["Country"]
					}]
				}]
			}).then(function(data) {
				var result = JSON.parse(JSON.stringify(data));
				if (result) {
					var cartheader = {};
					cartheader['totalPrice'] = 0;
					cartheader['cartItemsCount'] = result.count;
					var totalItems = result.rows;
					var totalPrice = {};
					var defaultShipping = 0;
					var marketplaceCount = {}
					marketplaceCount['PWM'] = 0;
					marketplaceCount['PM'] = 0;
					marketplaceCount['SM'] = 0;
					marketplaceCount['LM'] = 0;
					totalPrice['grandTotal'] = 0;
					var seperatedItems = _.groupBy(totalItems, "Product.Marketplace.code");
					_.forOwn(seperatedItems, function(itemsValue, itemsKey) {
						totalPrice[itemsKey] = {};
						totalPrice[itemsKey]['price'] = 0;
						totalPrice[itemsKey]['total'] = 0;
						totalPrice[itemsKey]['shipping'] = 0;

						for (var i = 0; i < itemsValue.length; i++) {

							marketplaceCount[itemsKey] = marketplaceCount[itemsKey] + 1;
							if ((itemsKey == itemsValue[i].Product.Marketplace.code) && itemsValue[i].Product.price) {
								var calulatedSum = (itemsValue[i].quantity * itemsValue[i].Product.price);

								totalPrice[itemsKey]['price'] = totalPrice[itemsKey]['price'] + calulatedSum;
								totalPrice[itemsKey]['shipping'] = totalPrice[itemsKey]['shipping'] + defaultShipping;
								totalPrice[itemsKey]['total'] = totalPrice[itemsKey]['price'] + totalPrice[itemsKey]['shipping'];
							}
						}

						totalPrice['grandTotal'] = totalPrice['grandTotal'] + totalPrice[itemsKey]['total'];
					});
					cartheader['totalPrice'] = totalPrice;
					cartheader['marketplaceCount'] = marketplaceCount;
					return callback(null, cartheader)
				}
			});
		},
		wantToSell: function(callback) {
			console.log("wanttosell","wanttosell");
			queryObj['marketplace_id'] = marketplace['WHOLESALE'];
			queryObj['marketplace_type_id'] = marketplace_type['WTS'];
			service.findRows(productModel, queryObj, offset, limit, field, order)
				.then(function(wantToSell) {
					return callback(null, wantToSell.rows);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		wantToBuy: function(callback) {
			console.log("wantToBuy","wantToBuy");
			queryObj['marketplace_id'] = marketplace['WHOLESALE'];
			queryObj['marketplace_type_id'] = marketplace_type['WTB'];
			service.findRows(productModel, queryObj, offset, limit, field, order)
				.then(function(wantToBuy) {
					return callback(null, wantToBuy.rows);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		wantToTrade: function(callback) {
			console.log("wantToTrade","wantToTrade");
			queryObj['marketplace_id'] = marketplace['WHOLESALE'];
			queryObj['marketplace_type_id'] = marketplace_type['WTT'];
			service.findRows(productModel, queryObj, offset, limit, field, order)
				.then(function(wantToTrade) {
					return callback(null, wantToTrade.rows);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		requestForQuote: function(callback) {
			console.log("requestForQuote","requestForQuote");
			queryObj['marketplace_id'] = marketplace['WHOLESALE'];
			queryObj['marketplace_type_id'] = marketplace_type['RFQ'];
			service.findRows(productModel, queryObj, offset, limit, field, order)
				.then(function(requestForQuote) {
					return callback(null, requestForQuote.rows);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		publicMarketplace: function(callback) {
			console.log("publicMarketplace","publicMarketplace");
			delete queryObj['marketplace_type_id'];
			queryObj['marketplace_id'] = marketplace['PUBLIC'];
			service.findRows(productModel, queryObj, offset, limit, field, order)
				.then(function(publicMarketplace) {
					return callback(null, publicMarketplace.rows);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		serviceMarketplace: function(callback) {
			console.log("serviceMarketplace","serviceMarketplace");
			queryObj['marketplace_id'] = marketplace['SERVICE'];
			service.findRows(productModel, queryObj, offset, limit, field, order)
				.then(function(serviceMarketplace) {
					return callback(null, serviceMarketplace.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		lifestyleMarketplace: function(callback) {
			console.log("lifestyleMarketplace","lifestyleMarketplace");
			queryObj['marketplace_id'] = marketplace['LIFESTYLE'];
			service.findRows(productModel, queryObj, offset, limit, field, order)
				.then(function(lifestyleMarketplace) {
					return callback(null, lifestyleMarketplace.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		featuredProducts: function(callback) {
			console.log("featuredProducts","featuredProducts");
			delete queryObj['marketplace_id'];
			queryObj['featured_position'] = position.HomePage;
			queryObj['is_featured_product'] = 1;
			limit = null;
			service.findRows(productModel, queryObj, offset, limit, field, order)
				.then(function(featuredProducts) {
					return callback(null, featuredProducts.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		topSellers: function(callback) {
			console.log("topSellers","topSellers");
			delete queryObj['featured_position'];
			delete queryObj['is_featured_product'];
			field = 'sales_count';
			order = 'desc';
			limit = 6;
			service.findRows(vendorModel, queryObj, offset, limit, field, order)
				.then(function(servicesProviders) {
					return callback(null, servicesProviders.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		}
	}, function(err, results) {
		if (!err) {
			res.render('homePage', {
				title: "Global Trade Connect",
				categories: results.categories,
				bottomCategory: bottomCategory,
				marketPlace: marketplace,
				marketPlaceType: marketplace_type,
				layout_type:layout_type.grid,
				wantToSell: results.wantToSell,
				wantToBuy: results.wantToBuy,
				wantToTrade: results.wantToTrade,
				requestForQuote: results.requestForQuote,
				publicMarketplace: results.publicMarketplace,
				serviceMarketplace: results.serviceMarketplace,
				lifestyleMarketplace: results.lifestyleMarketplace,
				featuredProducts: results.featuredProducts,
				topSellers: results.topSellers,
				cartheader:results.cartItems,
				LoggedInUser: LoggedInUser
			});
		} else {
			res.render('homePage', err);
		}
	});
}