'use strict';

const async = require('async');
const _ = require('lodash');
const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const reference = require('../../../config/model-reference');
const statusCode = require('../../../config/status');
const service = require('../../../api/service');
const populate = require('../../../utilities/populate');
const vendorPlan = require('../../../config/gtc-plan');
var url = require('url');

export function editListing(req, res) {

	let searchObj = {}, LoggedInUser = {}, queryObj = {}, type;
	var productModel = "Product";
	var categoryModel = "Category";
	var subCategoryModel = "SubCategory";
	var marketplaceTypeModel = "MarketplaceType";
	var featureModel = "MarketplaceProduct";
	var productIncludeArr = [];
	var bottomCategory = {};

	var offset, limit, field, order;
	offset = 0;
	limit = null;
	field = "id";
	order = "asc";

	productIncludeArr = populate.populateData('Marketplace,ProductMedia,Category,SubCategory,MarketplaceType');

	type = req.params.type;

	if (req.user)
		LoggedInUser = req.user;

	if (req.params.product_slug)
		searchObj["product_slug"] = req.params.product_slug;

	async.series({
		cartCounts: function(callback) {
            service.cartHeader(LoggedInUser).then(function(response) {
                return callback(null, response);
            }).catch(function(error) {
                console.log('Error :::', error);
                return callback(null);
            });
        },
		product: function(callback) {

			service.findOneRow(productModel, searchObj, productIncludeArr)
				.then(function(product) {
					return callback(null, product);

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

			categoryQueryObj['status'] = statusCode["ACTIVE"];

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
		subCategory: function(callback) {

			service.findRows(subCategoryModel, queryObj, offset, limit, field, order)
				.then(function(subCategory) {
					return callback(null, subCategory.rows);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		marketplaceType: function(callback) {
			service.findRows(marketplaceTypeModel, queryObj, offset, limit, field, order)
				.then(function(marketplaceType) {
					return callback(null, marketplaceType.rows);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		feature: function(callback) {
			service.findOneRow(featureModel, searchObj)
				.then(function(feature) {
					return callback(null, feature);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		}
	}, function(err, results) {
		var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
		var dropDownUrl = fullUrl.replace(req.url, '').replace(req.protocol + '://' + req.get('host'), '').replace('/', '');
		if (!err) {
			res.render('vendorNav/listings/edit-listing', {
				title: "Global Trade Connect",
				statusCode: statusCode,
				product: results.product,
				categories: results.categories,
				bottomCategory: bottomCategory,
				subCategory: results.subCategory,
				LoggedInUser: LoggedInUser,
				marketplaceType: results.marketplaceType,
				cartheader:results.cartCounts,
				type: type,
				vendorPlan: vendorPlan,
				feature: results.feature,
				dropDownUrl: dropDownUrl
			});
		} else {
			res.render('vendorNav/listings/edit-listing', err);
		}
	});
}