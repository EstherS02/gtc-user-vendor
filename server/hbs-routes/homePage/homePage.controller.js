'use strict';

const _ = require('lodash');
var async = require('async');
const sequelize = require('sequelize');

const service = require('../../api/service');
const cartService = require('../../api/cart/cart.service');
const status = require('../../config/status');
const model = require('../../sqldb/model-connect');
const position = require('../../config/position');
const marketplace = require('../../config/marketplace');
const marketplace_type = require('../../config/marketplace_type');
const productService = require('../../api/product/product.service');

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
			console.log("wanttosell", "wanttosell");
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
			console.log("wantToBuy", "wantToBuy");
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
			console.log("wantToTrade", "wantToTrade");
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
			console.log("requestForQuote", "requestForQuote");
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
			console.log("publicMarketplace", "publicMarketplace");
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
			console.log("serviceMarketplace", "serviceMarketplace");
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
			console.log("lifestyleMarketplace", "lifestyleMarketplace");
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
			console.log("featuredProducts", "featuredProducts");
			delete queryObj['marketplace_id'];
			queryObj['featured_position'] = position.HomePage;
			queryObj['is_featured_product'] = 1;
			limit = 6;
			var order = [
				sequelize.fn('RAND'),
			];
			productService.RandomProducts(productModel, queryObj, limit, order)
				.then(function(response) {
					return callback(null, response.rows);
				}).catch(function(error) {
					console.log('Error::', error);
					return callback(null);
				});
		},
		topSellers: function(callback) {
			console.log("testTopSellers", "testTopSellers");
			var result = {};
			delete queryObj['featured_position'];
			delete queryObj['is_featured_product'];
			field = 'sales_count';
			order = 'desc';
			limit = 6;
			service.findRows(vendorModel, queryObj, offset, limit, field, order)
				.then(function(servicesProviders) {
					result.rows = JSON.parse(JSON.stringify(servicesProviders.rows));
					var vendorAvgRating = {};
					vendorAvgRating['status'] = {
						'$eq': status["ACTIVE"]
					}
					async.mapSeries(result.rows, function(aVendor, cb) {
						vendorAvgRating['vendor_id'] = aVendor.id;
						model['ProductRatings'].findOne({
							where: vendorAvgRating,
							attributes: [
								[sequelize.fn('AVG', sequelize.col('product_rating')), 'rating']
							],
						}).then(function(data) {
							var ratingObj = JSON.parse(JSON.stringify(data))
							aVendor['avg_rating'] = ratingObj.rating ? ratingObj.rating : '0.0';
							cb(null, data);
						}).catch(function(error) {
							console.log('Error:::', error);
							cb(error, null);
						});
					}, function done(err, success) {
						if (!err) {
							return callback(null, result);
						}
					});
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(error, null);
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