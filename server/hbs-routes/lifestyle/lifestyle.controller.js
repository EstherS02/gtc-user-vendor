'use strict';
const sequelize = require('sequelize');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const status = require('../../config/status');
const service = require('../../api/service');
const marketplace = require('../../config/marketplace');
const productService = require('../../api/product/product.service');
const cartService = require('../../api/cart/cart.service');
const async = require('async');

export function lifestyle(req, res) {
	var vendorModel = "VendorUserProduct";
	var categoryModel = "Category";
	var offset, limit, field, order;
	var queryObj = {},
		LoggedInUser = {},
		bottomCategory = {};

	if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable)
		LoggedInUser = req.gtcGlobalUserObj;

	limit = 20;
	offset = 0;
	field = "id";
	order = "asc";

	queryObj['status'] = status["ACTIVE"];
	queryObj['marketplace_id'] = 4;

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
		featuredProducts: function(callback) {
			const tempLimit = 6;
			queryObj['is_featured_product'] = 1;
			queryObj['position'] = 'position_subscription_landing';

			productService.queryAllProducts(LoggedInUser.id, queryObj, 0, tempLimit)
				.then(function(results) {
					return callback(null, results);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		lifestyleMarketplace: function(callback) {
			delete queryObj['is_featured_product'];
			delete queryObj['position'];

			queryObj['marketplace_id'] = marketplace['LIFESTYLE'];
			productService.queryAllProducts(LoggedInUser.id, queryObj, offset, limit, field, order)
				.then(function(lifestyleMarketplace) {
					return callback(null, lifestyleMarketplace);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		subscriptionProviders: function(callback) {
			return callback(null, null);
			// CHECK_IT_LATER
			/*var result = {};
			delete queryObj['marketplace'];
			queryObj['type'] = 'Lifestyle Marketplace';
			field = 'sales_count';
			order = 'desc';
			limit = 6;
			service.findRows(vendorModel, queryObj, offset, limit, field, order)
				.then(function(subscriptionProviders) {
					result.rows = JSON.parse(JSON.stringify(subscriptionProviders.rows));
					var vendorAvgRating = {};
					vendorAvgRating['status'] = {
						'$eq': status["ACTIVE"]
					}
					async.mapSeries(result.rows, function(aVendor, cb) {
						vendorAvgRating['vendor_id'] = aVendor.id;
						model['ProductRating'].findOne({
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
					return callback(null);
				});*/
		}
	}, function(err, results) {
		if (!err) {
			res.render('lifestyle', {
				title: "Global Trade Connect",
				categories: results.categories,
				bottomCategory: bottomCategory,
				marketPlace: marketplace,
				featuredProducts: results.featuredProducts,
				lifestyleMarketplace: results.lifestyleMarketplace,
				subscriptionProviders: results.subscriptionProviders,
				cart: results.cartInfo,
				LoggedInUser: LoggedInUser
			});
		} else {
			res.render('lifestyle', err);
		}
	});
}