'use strict';
const sequelize = require('sequelize');

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const position = require('../../config/position');
const service = require('../../api/service');
const marketplace = require('../../config/marketplace');
const _ = require('lodash');
const async = require('async');
import series from 'async/series';

export function lifestyle(req, res) {
	var productModel = "MarketplaceProduct";
	var vendorModel = "VendorUserProduct";
	var categoryModel = "Category";
	var offset, limit, field, order;
	var queryObj = {};
	var LoggedInUser = {};
	var bottomCategory = {};

	if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable)
		LoggedInUser = req.gtcGlobalUserObj;

	offset = 0;
	field = "id";
	order = "asc";

	queryObj['status'] = status["ACTIVE"];
	queryObj['marketplace_id'] = 4;

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
		featuredProducts: function(callback) {
			limit = null;
			queryObj['featured_position'] = position.LifestyleLanding;
			queryObj['is_featured_product'] = 1;
			service.findRows(productModel, queryObj, offset, limit, field, order)
				.then(function(featuredProducts) {
					return callback(null, featuredProducts.rows);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		lifestyle: function(callback) {
			const includeArr = [];
			const productOffset = 0;
			const productLimit = 20;
			const productField = "id";
			const productOrder = "asc";
			delete queryObj['featured_position'];
			delete queryObj['is_featured_product'];
			service.findAllRows(productModel, includeArr, queryObj, productOffset, productLimit, productField, productOrder)
				.then(function(lifestyle) {
					return callback(null, lifestyle);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		subscriptionProviders: function(callback) {
			var result = {};
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
						model['ProductRatings'].findOne({
							where: vendorAvgRating,
							attributes: [[sequelize.fn('AVG', sequelize.col('product_rating')), 'rating']],
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
			res.render('lifestyle', {
				title: "Global Trade Connect",
				categories: results.categories,
				bottomCategory: bottomCategory,
				marketPlace: marketplace,
				featuredProducts: results.featuredProducts,
				lifestyle: results.lifestyle,
				subscriptionProviders: results.subscriptionProviders,
				cartheader: results.cartCounts,
				LoggedInUser: LoggedInUser
			});
		} else {
			res.render('lifestyle', err);
		}
	});
}