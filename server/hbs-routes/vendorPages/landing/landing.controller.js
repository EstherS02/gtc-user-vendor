'use strict';

const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const reference = require('../../../config/model-reference');
const status = require('../../../config/status');
const verificationStatus = require('../../../config/verification_status');
const service = require('../../../api/service');
const sequelize = require('sequelize');
const marketplace = require('../../../config/marketplace');
const cartService = require('../../../api/cart/cart.service');
const marketplace_type = require('../../../config/marketplace_type');
const Plan = require('../../../config/gtc-plan');
const productService = require('../../../api/product/product.service');
const moment = require('moment');
import series from 'async/series';
var async = require('async');

export function vendor(req, res) {
	var LoggedInUser = {};

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;

	var productModel = "MarketplaceProduct";
	var categoryModel = "Category";
	var bottomCategory = {};
	var offset = 0;
	var limit;
	var field = "created_on";
	var order = "desc"
	var queryObj = {};
	var vendor_id = req.params.id;
	queryObj['vendor_id'] = vendor_id;

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
			queryObj['position'] = 'position_profilepage';
			queryObj['is_featured_product'] = 1;
			// queryObj['vendor_id'] = LoggedInUser.Vendor.id
			limit = 2;
			productService.queryAllProducts(LoggedInUser.id, queryObj, 0, limit)
				.then(function(results) {
					return callback(null, results);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		topSelling: function(callback) {
			delete queryObj['is_featured_product'];

			queryObj['vendor_id'] = vendor_id;
			field = 'product_selling_count';
			order = 'desc';
			limit = 3;
			service.findRows(productModel, queryObj, offset, limit, field, order)
				.then(function(servicesProviders) {
					return callback(null, servicesProviders.rows);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		topRating: function(callback) {
			delete queryObj['featured_position'];
			delete queryObj['is_featured_product'];
			queryObj['vendor_id'] = vendor_id;
			field = 'product_rating';
			order = 'desc';
			limit = 3;
			service.findRows(productModel, queryObj, offset, limit, field, order)
				.then(function(servicesProviders) {
					return callback(null, servicesProviders.rows);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		VendorDetail: function(callback) {
			var vendorIncludeArr = [{
				model: model['Country']

			}, {
				model: model['VendorPlan'],
				required: false
			}, {
				model: model['VendorVerification'],
				where: {
					// vendor_verified_status: status['ACTIVE']
					vendor_verified_status: verificationStatus['APPROVED']
				},
				required: false
			}, {
				model: model['VendorFollower'],
				where: {
					user_id: req.user.id,
					status: 1
				},
				required: false
			}, {
				model: model['VendorRating'],
				attributes: [
					[sequelize.fn('AVG', sequelize.col('VendorRatings.rating')), 'rating'],
					[sequelize.fn('count', sequelize.col('VendorRatings.rating')), 'count']
				],
				group: ['VendorRating.vendor_id'],
				required: false,
			}];
			service.findIdRow('Vendor', vendor_id, vendorIncludeArr)
				.then(function(response) {
					return callback(null, response);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		VendorAvgRating: function(callback) {
			var vendorAvgRating = {};
			vendorAvgRating['vendor_id'] = vendor_id;

			vendorAvgRating['status'] = {
				'$eq': status["ACTIVE"]
			}

			model['ProductRatings'].findAll({
				where: vendorAvgRating,
				attributes: [
					[sequelize.fn('AVG', sequelize.col('product_rating')), 'rating']
				],
			}).then(function(data) {
				var result = JSON.parse(JSON.stringify(data));
				return callback(null, result);
			}).catch(function(error) {
				console.log('Error:::', error);
				return callback(error, null);
			});
		},
	}, function(err, results) {
		if (!err) {
			res.render('vendorPages/vendor', {
				title: "Global Trade Connect",
				categories: results.categories,
				bottomCategory: bottomCategory,
				VendorDetail: results.VendorDetail,
				featuredProducts: results.featuredProducts,
				topSelling: results.topSelling,
				topRating: results.topRating,
				cart: results.cartInfo,
				marketPlace: marketplace,
				LoggedInUser: LoggedInUser,
				Plan: Plan,
				VendorAvgRating: results.VendorAvgRating
				// selectedPage:'shop'
			});
		} else {
			res.render('vendor', err);
		}
	});
}