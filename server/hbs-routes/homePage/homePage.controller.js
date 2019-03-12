'use strict';

const _ = require('lodash');
var async = require('async');
const sequelize = require('sequelize');
const service = require('../../api/service');
const cartService = require('../../api/cart/cart.service');
const status = require('../../config/status');
const model = require('../../sqldb/model-connect');
const marketplace = require('../../config/marketplace');
const marketplace_type = require('../../config/marketplace_type');
const productService = require('../../api/product/product.service');
const vendorService = require('../../api/vendor/vendor.service');

export function homePage(req, res) {
	var vendorModel = "VendorUserProduct";
	var categoryModel = "Category";
	var bottomCategory = {};
	var offset, limit, field, order;
	var queryObj = {};
	var LoggedInUser = {};

	offset = 0;
	limit = 5;
	field = "created_on";
	order = "desc";

	queryObj['status'] = status["ACTIVE"];

	if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable) {
		LoggedInUser = req.gtcGlobalUserObj;
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
		wantToSell: function(callback) {
			queryObj['marketplace_id'] = marketplace['WHOLESALE'];
			queryObj['marketplace_type_id'] = marketplace_type['WTS'];
			productService.queryAllProducts(LoggedInUser.id, queryObj, offset, limit, field, order)
				.then(function(wantToSell) {
					return callback(null, wantToSell.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		wantToBuy: function(callback) {
			queryObj['marketplace_id'] = marketplace['WHOLESALE'];
			queryObj['marketplace_type_id'] = marketplace_type['WTB'];
			productService.queryAllProducts(LoggedInUser.id, queryObj, offset, limit, field, order)
				.then(function(wantToBuy) {
					return callback(null, wantToBuy.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		wantToTrade: function(callback) {
			queryObj['marketplace_id'] = marketplace['WHOLESALE'];
			queryObj['marketplace_type_id'] = marketplace_type['WTT'];
			productService.queryAllProducts(LoggedInUser.id, queryObj, offset, limit, field, order)
				.then(function(wantToTrade) {
					return callback(null, wantToTrade.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		requestForQuote: function(callback) {
			queryObj['marketplace_id'] = marketplace['WHOLESALE'];
			queryObj['marketplace_type_id'] = marketplace_type['RFQ'];
			productService.queryAllProducts(LoggedInUser.id, queryObj, offset, limit, field, order)
				.then(function(requestForQuote) {
					return callback(null, requestForQuote.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		publicMarketplace: function(callback) {
			delete queryObj['marketplace_type_id'];
			queryObj['marketplace_id'] = marketplace['PUBLIC'];
			productService.queryAllProducts(LoggedInUser.id, queryObj, offset, limit, field, order)
				.then(function(publicMarketplace) {
					return callback(null, publicMarketplace.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		serviceMarketplace: function(callback) {
			queryObj['marketplace_id'] = marketplace['SERVICE'];
			productService.queryAllProducts(LoggedInUser.id, queryObj, offset, limit, field, order)
				.then(function(serviceMarketplace) {
					return callback(null, serviceMarketplace.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		lifestyleMarketplace: function(callback) {
			queryObj['marketplace_id'] = marketplace['LIFESTYLE'];
			productService.queryAllProducts(LoggedInUser.id, queryObj, offset, limit, field, order)
				.then(function(lifestyleMarketplace) {
					return callback(null, lifestyleMarketplace.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		featuredProducts: function(callback) {
			delete queryObj['marketplace_id'];
			// queryObj['featured_position_homepage']=1;
			queryObj['position']='position_homepage';

			queryObj['is_featured_product'] = 1;
			limit = 6;
			productService.queryAllProducts(LoggedInUser.id, queryObj, 0, limit)
				.then(function(results) {

					return callback(null, results);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		topSellers: function(callback) {
			vendorService.TopSellingVendors(0, 6, null)
				.then((response) => {
					return callback(null, response);
				})
				.catch((error) => {
					console.log("wholesalers Error:::", error);
					return callback(error);
				});
		},
	}, function(err, results) {
		if (!err) {
			res.render('homePage', {
				title: "Global Trade Connect",
				cart: results.cartInfo,
				categories: results.categories,
				bottomCategory: bottomCategory,
				marketPlace: marketplace,
				marketPlaceType: marketplace_type,
				wantToSell: results.wantToSell,
				wantToBuy: results.wantToBuy,
				wantToTrade: results.wantToTrade,
				requestForQuote: results.requestForQuote,
				publicMarketplace: results.publicMarketplace,
				serviceMarketplace: results.serviceMarketplace,
				lifestyleMarketplace: results.lifestyleMarketplace,
				featuredProducts: results.featuredProducts,
				topSellers: results.topSellers,
				LoggedInUser: LoggedInUser
			});
		} else {
			res.render('homePage', err);
		}
	});
}