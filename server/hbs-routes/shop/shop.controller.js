'use strict';
const sequelize = require('sequelize');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const status = require('../../config/status');
const marketplace = require('../../config/marketplace');
const cartService = require('../../api/cart/cart.service');
const service = require('../../api/service');
const productService = require('../../api/product/product.service');
const async = require('async');

export function shop(req, res) {
	var categoryModel = "Category";
	var vendorModel = "VendorUserProduct";
	var offset, limit, field, order;
	var queryObj = {};
	var LoggedInUser = {};
	var bottomCategory = {};

	if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable)
		LoggedInUser = req.gtcGlobalUserObj;

	offset = 0;
	limit = 20;
	field = "id";
	order = "asc";

	queryObj['status'] = status["ACTIVE"];
	queryObj['marketplace_id'] = 2;

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
					return callback(null);
				});
		},
		featuredProducts: function(callback) {
			const tempLimit = 6;
			queryObj['position'] = 'position_shop_landing';
			queryObj['is_featured_product'] = 1;

			productService.queryAllProducts(LoggedInUser.id, queryObj, 0, tempLimit)
				.then(function(results) {
					return callback(null, results);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		publicMarketplace: function(callback) {
			delete queryObj['is_featured_product'];
			delete queryObj['position'];

			queryObj['marketplace_id'] = marketplace['PUBLIC'];
			productService.queryAllProducts(LoggedInUser.id, queryObj, offset, limit, field, order)
				.then(function(publicMarketplace) {
					return callback(null, publicMarketplace);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		retailers: function(callback) {
			return callback(null, null);
			// CHECK_IT_LATER
			/*var result = {};
			delete queryObj['marketplace_id'];
			queryObj['type'] = 'Public Marketplace';
			field = 'sales_count';
			order = 'desc';
			limit = 6;
			service.findRows(vendorModel, queryObj, offset, limit, field, order)
				.then(function(retailers) {
					result.rows = JSON.parse(JSON.stringify(retailers.rows));
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
		},
	}, function(err, results) {
		if (!err) {
			res.render('shop', {
				title: "Global Trade Connect",
				categories: results.categories,
				bottomCategory: bottomCategory,
				marketPlace: marketplace,
				featuredProducts: results.featuredProducts,
				publicMarketplace: results.publicMarketplace,
				retailers: results.retailers,
				cart: results.cartInfo,
				LoggedInUser: LoggedInUser
			});
		} else {
			res.render('shop', err);
		}
	});
}