'use strict';

const async = require('async');
const sequelize = require('sequelize');

const model = require('../../sqldb/model-connect');
const status = require('../../config/status');
const service = require('../../api/service');
const cartService = require('../../api/cart/cart.service');
const marketplace = require('../../config/marketplace');

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
		cartInfo: function(callback) {
			if (LoggedInUser.id) {
				cartService.cartCalculation(LoggedInUser.id, req)
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
			var result = {};
			queryObj['type'] = 'Private Wholesale Marketplace';
			field = 'sales_count';
			order = 'desc';
			limit = 6;
			service.findRows(vendorModel, queryObj, offset, limit, field, order)
				.then(function(wholesalers) {
					result.rows = JSON.parse(JSON.stringify(wholesalers.rows));
					var vendorAvgRating = {};
					vendorAvgRating['status'] = {
						'$eq': status["ACTIVE"]
					}
					async.mapSeries(result.rows, function(aVendor, cb) {
						vendorAvgRating['vendor_id'] = aVendor.id;
						model['ProductRatings'].findOne({
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
		},
		retailers: function(callback) {
			console.log("retailers")
			var result = {};
			queryObj['type'] = 'Public Marketplace';
			field = 'sales_count';
			order = 'desc';
			limit = 6;
			service.findRows(vendorModel, queryObj, offset, limit, field, order)
				.then(function(retailers) {
					result.rows = JSON.parse(JSON.stringify(retailers.rows));
					var vendorAvgRating = {};
					vendorAvgRating['status'] = {
						'$eq': status["ACTIVE"]
					}
					async.mapSeries(result.rows, function(aVendor, cb) {
						vendorAvgRating['vendor_id'] = aVendor.id;
						model['ProductRatings'].findOne({
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
		},
		servicesProviders: function(callback) {
			var result = {};
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
						model['ProductRatings'].findOne({
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
		},
		subscriptionProviders: function(callback) {
			var result = {};
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