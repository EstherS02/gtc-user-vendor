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
	var categoryModel = "Category";
	var productModel = "MarketplaceProduct";
	var vendorModel = "VendorUserProduct";
	var offset, limit, field, order;
	var queryObj = {};
	var LoggedInUser = {};

	if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable)
		LoggedInUser = req.gtcGlobalUserObj;

	offset = 0;
	field = "id";
	order = "asc";

	queryObj['status'] = status["ACTIVE"];
	queryObj['marketplace_id'] = 4;

	async.series({
		topSearchCategory: function(callback) {
			const topCategoryOffset = 0;
			const topCategoryLimit = null;
			const topCategoryField = "id";
			const topCategoryOrder = "asc";
			const topCategoryQueryObj = {};

			topCategoryQueryObj['status'] = status["ACTIVE"];

			service.findRows(categoryModel, topCategoryQueryObj, topCategoryOffset, topCategoryLimit, topCategoryField, topCategoryOrder)
				.then(function(category) {
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
				topSearchCategories: results.topSearchCategory,
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