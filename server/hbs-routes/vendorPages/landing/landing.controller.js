'use strict';

const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const reference = require('../../../config/model-reference');
const status = require('../../../config/status');
const service = require('../../../api/service');
const sequelize = require('sequelize');
const marketplace = require('../../../config/marketplace');
const marketplace_type = require('../../../config/marketplace_type');
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
			queryObj['is_featured_product'] = 1;
			limit = 1;
			service.findRows(productModel, queryObj, offset, limit, field, order)
				.then(function(featuredProducts) {
					return callback(null, featuredProducts.rows);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		topSelling: function(callback) {
			delete queryObj['featured_position'];
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
					vendor_verified_status: status['ACTIVE']
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
					[sequelize.fn('AVG', sequelize.col('VendorRatings.rating')), 'rating']
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
				LoggedInUser: LoggedInUser
				// selectedPage:'shop'
			});
		} else {
			res.render('vendor', err);
		}
	});



}