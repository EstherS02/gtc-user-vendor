'use strict';
const sequelize = require('sequelize');

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const position = require('../../config/position');
const marketplace = require('../../config/marketplace');
const cartService = require('../../api/cart/cart.service');
const service = require('../../api/service');
const async = require('async');
const productService = require('../../api/product/product.service');

export function services(req, res) {
	var categoryModel = "Category";
	var productModel = "MarketplaceProduct";
	var vendorModel = "VendorUserProduct";
	var offset, limit, field, order;
	var queryObj = {};
	var LoggedInUser = {};
	var bottomCategory = {};

	if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable)
		LoggedInUser = req.gtcGlobalUserObj;

	offset = 0;
	field = "id";
	order = "asc";
	limit = 20;

	queryObj['status'] = status["ACTIVE"];

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
		featuredService: function(callback) {
			queryObj['featured_position_service_landing'] = 1;
			queryObj['is_featured_product'] = 1;
			var featureLimit = 6;
			var order = [
				sequelize.fn('RAND'),
			];
			productService.RandomProducts(productModel, queryObj, featureLimit, order)
				.then(function(response) {
					return callback(null, response.rows);
				}).catch(function(error) {
					console.log('Error::', error);
					return callback(null);
				});
		},
		serviceMarketplace: function(callback) {
			delete queryObj['featured_position_service_landing'];
			delete queryObj['is_featured_product'];
			queryObj['marketplace_id'] = marketplace['SERVICE'];
			productService.queryAllProducts(LoggedInUser.id, queryObj, offset, limit, field, order)
				.then(function(serviceMarketplace) {
					return callback(null, serviceMarketplace);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		servicesProviders: function(callback) {
			var result = {};
			delete queryObj['marketplace_id'];
			queryObj['type'] = 'Services Marketplace';
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
				});
		}
	}, function(err, results) {
		if (!err) {
			res.render('services', {
				title: "Global Trade Connect",
				categories: results.categories,
				bottomCategory: bottomCategory,
				marketPlace: marketplace,
				featuredService: results.featuredService,
				serviceMarketplace: results.serviceMarketplace,
				servicesProviders: results.servicesProviders,
				cart: results.cartInfo,
				LoggedInUser: LoggedInUser
			});
		} else {
			res.render('services', err);
		}
	});
}