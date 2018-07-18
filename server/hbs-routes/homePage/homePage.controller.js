'use strict';

var async = require('async');

const service = require('../../api/service');
const status = require('../../config/status');
const position = require('../../config/position');
const marketplace = require('../../config/marketplace');
const marketplace_type = require('../../config/marketplace_type');
const config = require('../../config/environment');

export function homePage(req, res) {
	var productModel = "MarketplaceProduct";
	var vendorModel = "VendorUserProduct";
	var categoryModel = "Category";
	var offset, limit, field, order;
	var queryObj = {};
	var LoggedInUser = {};
	var bottomCategory = {};

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
		wantToSell: function(callback) {
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