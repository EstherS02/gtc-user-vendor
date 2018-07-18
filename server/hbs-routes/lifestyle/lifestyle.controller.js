'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const position = require('../../config/position');
const service = require('../../api/service');
const marketplace = require('../../config/marketplace');

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
			limit = 20;
			delete queryObj['featured_position'];
			delete queryObj['is_featured_product'];
			service.findRows(productModel, queryObj, offset, limit, field, order)
				.then(function(lifestyle) {
					return callback(null, lifestyle.rows);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		subscriptionProviders: function(callback) {
			delete queryObj['marketplace'];
			queryObj['type'] = 'Lifestyle Marketplace';
			field = 'sales_count';
			order = 'desc';
			limit = 6;
			service.findRows(vendorModel, queryObj, offset, limit, field, order)
				.then(function(subscriptionProviders) {
					return callback(null, subscriptionProviders.rows);

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
				LoggedInUser: LoggedInUser
			});
		} else {
			res.render('lifestyle', err);
		}
	});
}