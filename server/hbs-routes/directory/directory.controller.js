'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');
const marketplace = require('../../config/marketplace');
const async = require('async');

export function directory(req, res) {
	var categoryModel = "Category";
	var subcategoryModel = "SubCategory";
	var countryModel = "Country";
	var marketplaceModel = "Marketplace";
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

	queryObj['status'] = status["ACTIVE"];

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
		subCategory: function(callback) {
			limit = null;
			service.findRows(subcategoryModel, queryObj, offset, limit, field, order)
				.then(function(subCategory) {
					return callback(null, subCategory.rows);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		country: function(callback) {
			service.findRows(countryModel, queryObj, offset, limit, field, order)
				.then(function(country) {
					return callback(null, country.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		depart: function(callback) {
			limit = null
			service.findRows(marketplaceModel, queryObj, offset, limit, field, order)
				.then(function(depart) {
					return callback(null, depart.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		wholesalers: function(callback) {
			console.log("wholesalers")
			queryObj['type'] = 'Private Wholesale Marketplace';
			field = 'sales_count';
			order = 'desc';
			limit = 6;
			service.findRows(vendorModel, queryObj, offset, limit, field, order)
				.then(function(wholesalers) {
					return callback(null, wholesalers.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		retailers: function(callback) {
			console.log("retailers")
			queryObj['type'] = 'Public Marketplace';
			field = 'sales_count';
			order = 'desc';
			limit = 6;
			service.findRows(vendorModel, queryObj, offset, limit, field, order)
				.then(function(retailers) {
					return callback(null, retailers.rows);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		servicesProviders: function(callback) {
			console.log("servicesProviders")
			queryObj['type'] = 'Services Marketplace';
			field = 'sales_count';
			order = 'desc';
			limit = 6;
			service.findRows(vendorModel, queryObj, offset, limit, field, order)
				.then(function(servicesProviders) {
					return callback(null, servicesProviders.rows);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		subscriptionProviders: function(callback) {
			console.log("subscriptionProviders")
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
		},
	}, function(err, results) {
		if (!err) {
			res.render('directory', {
				title: "Global Trade Connect",
				categories: results.categories,
				bottomCategory: bottomCategory,
				subCategory: results.subCategory,
				country: results.country,
				wholesalers: results.wholesalers,
				retailers: results.retailers,
				servicesProviders: results.servicesProviders,
				subscriptionProviders: results.subscriptionProviders,
				depart: results.depart,
				cartheader:results.cartCounts,
				LoggedInUser: LoggedInUser,
				marketplace: marketplace
			});
		} else {
			res.render('directory', err);
		}
	});
}