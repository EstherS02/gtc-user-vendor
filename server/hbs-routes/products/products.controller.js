'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const status = require('../../config/status');
const service = require('../../api/service');
const marketplace = require('../../config/marketplace');
const cartService = require('../../api/cart/cart.service');
const productService = require('../../api/product/product.service');
const notifictionService = require('../../api/notification/notification.service');
const async = require('async');

export function products(req, res) {
	var marketplaceModel = "Marketplace";
	var categoryModel = "Category";
	var subcategoryModel = "SubCategory";
	var countryModel = "Country";
	var offset, limit, field, order;
	var queryObj = {};
	var LoggedInUser = {};
	var bottomCategory = {};

	if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable)
		LoggedInUser = req.gtcGlobalUserObj;

	offset = 0;
	limit = 4;
	field = 'product_selling_count';
	order = 'desc';

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
		wholesalerProducts: function(callback) {
			queryObj['marketplace_id'] = 1;
			productService.TopSellingProducts(offset, limit, marketplace['WHOLESALE'])
				.then(function(wholesalerProducts) {
					return callback(null, wholesalerProducts);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		retailProducts: function(callback) {
			queryObj['marketplace_id'] = 2;
			productService.TopSellingProducts(offset, limit, marketplace['PUBLIC'])
				.then(function(retailProducts) {
					return callback(null, retailProducts);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		services: function(callback) {
			queryObj['marketplace_id'] = 3;
			productService.TopSellingProducts(offset, limit, marketplace['SERVICE'])
				.then(function(services) {
					return callback(null, services);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		subscriptions: function(callback) {
			queryObj['marketplace_id'] = 4;
			productService.TopSellingProducts(offset, limit, marketplace['LIFESTYLE'])
				.then(function(subscriptions) {
					return callback(null, subscriptions);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		subCategory: function(callback) {
			delete queryObj['marketplace_id'];
			limit = null;
			order = 'asc';
			field = 'id';
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
		globalProductCounts: function(callback) {
				productService.productGlobalCounts(marketplace['WHOLESALE'])
					.then((globalCount) => {
						return callback(null, globalCount);
					}).catch((error) => {
						return callback(error);
					});
			
		},
		unreadCounts: function(callback) {
			notifictionService.notificationCounts(LoggedInUser.id)
				.then(function(counts) {
					return callback(null, counts);
				}).catch(function(error) {
					return callback(null);
				});
		}
	}, function(err, results) {
		if (!err) {
			res.render('products', {
				title: "Global Trade Connect",
				categories: results.categories,
				bottomCategory: bottomCategory,
				marketPlace: marketplace,
				wholesalerProducts: results.wholesalerProducts,
				retailProducts: results.retailProducts,
				services: results.services,
				subscriptions: results.subscriptions,
				subCategory: results.subCategory,
				country: results.country,
				cart: results.cartInfo,
				marketPlace: marketplace,
				depart: results.depart,
				globalProductCounts:results.globalProductCounts,
				unreadCounts: results.unreadCounts,
				LoggedInUser: LoggedInUser
			});
		} else {
			res.render('products', err);
		}
	});
}