'use strict';

const async = require('async');
const sequelize = require('sequelize');
const model = require('../../sqldb/model-connect');
const status = require('../../config/status');
const service = require('../../api/service');
const cartService = require('../../api/cart/cart.service');
const vendorService = require('../../api/vendor/vendor.service');
const marketplace = require('../../config/marketplace');

export function directory(req, res) {
	var categoryModel = "Category";
	var subcategoryModel = "SubCategory";
	var countryModel = "Country";
	var marketplaceModel = "Marketplace";
	var vendorModel = "VendorUserProduct";
	var offset, limit, field, order;
	var queryObj = {},
		LoggedInUser = {},
		bottomCategory = {};

	if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable)
		LoggedInUser = req.gtcGlobalUserObj;

	offset = 0;
	field = "id";
	order = "asc";

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
			vendorService.TopSellingVendors(0, 6, marketplace['WHOLESALE'])
				.then((response) => {
					return callback(null, response);
				})
				.catch((error) => {
					console.log("wholesalers Error:::", error);
					return callback(error);
				});
		},
		retailers: function(callback) {
			vendorService.TopSellingVendors(0, 6, marketplace['PUBLIC'])
				.then((response) => {
					return callback(null, response);
				})
				.catch((error) => {
					console.log("wholesalers Error:::", error);
					return callback(error);
				});
		},
		servicesProviders: function(callback) {
			vendorService.TopSellingVendors(0, 6, marketplace['SERVICE'])
				.then((response) => {
					return callback(null, response);
				})
				.catch((error) => {
					console.log("wholesalers Error:::", error);
					return callback(error);
				});
		},
		subscriptionProviders: function(callback) {
			vendorService.TopSellingVendors(0, 6, marketplace['LIFESTYLE'])
				.then((response) => {
					return callback(null, response);
				})
				.catch((error) => {
					console.log("wholesalers Error:::", error);
					return callback(error);
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
				LoggedInUser: LoggedInUser,
				cart: results.cartInfo,
				marketPlace: marketplace
			});
		} else {
			res.render('directory', err);
		}
	});
}