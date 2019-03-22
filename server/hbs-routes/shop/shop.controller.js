'use strict';
const sequelize = require('sequelize');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const status = require('../../config/status');
const position = require('../../config/position');
const marketplace = require('../../config/marketplace');
const cartService = require('../../api/cart/cart.service');
const vendorService = require('../../api/vendor/vendor.service');
const service = require('../../api/service');
const productService = require('../../api/product/product.service');
const async = require('async');

export function shop(req, res) {
	var categoryModel = "Category";
	var vendorModel = "VendorUserProduct";
	var productAdModelName = 'ProductAdsSetting';
	var offset, limit, field, order;
	var queryObj = {};
	var LoggedInUser = {};
	var bottomCategory = {};

	if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable)
		LoggedInUser = req.gtcGlobalUserObj;

	offset = 0;
	limit = 20;
	field = "created_on";
	order = "desc";

	queryObj['status'] = status["ACTIVE"];
	queryObj['marketplace_id'] = 2;

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
			const tempLimit = 6;
			queryObj['position'] = 'position_shop_landing';
			queryObj['is_featured_product'] = 1;

			productService.queryAllProducts(LoggedInUser.id, queryObj, 0, tempLimit)
				.then(function(results) {
					if(results.count > 0 ){
						var featureIds = [];
						for (var i = 0; i < results.rows.length; i++) { 
							featureIds.push(results.rows[i].FeaturedProducts[0].id);
						}
						model['FeaturedProduct'].increment({
							'impression': 1
						}, {
							where: {
								id: featureIds
							}
						}).then(function(updatedRow){
							console.log("Impression Response::", updatedRow);
						}).catch(function(error){
							console.log("Error::", error);
						})
					}
					return callback(null, results);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		publicMarketplace: function(callback) {
			delete queryObj['is_featured_product'];
			delete queryObj['position'];

			queryObj['marketplace_id'] = marketplace['PUBLIC'];
			productService.queryAllProducts(LoggedInUser.id, queryObj, offset, limit, field, order)
				.then(function(publicMarketplace) {
					return callback(null, publicMarketplace);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		retailers: function(callback) {
			vendorService.TopSellingVendors(0, 6, marketplace['PUBLIC'])
				.then((response) => {
					return callback(null, response.rows);
				})
				.catch((error) => {
					console.log("retailers Error:::", error);
					return callback(error);
				});
		},
		buyerCount: function(callback) {
			productService.userBuyerCount(marketplace['PUBLIC'])
			.then((response) => {
				return callback(null, response);
			})
			.catch((error) => {
				console.log(" Error:::", error);
				return callback(error);
			});
		},
		shopRandomAd: function(callback) {
			var queryObj = {};
			queryObj['position'] = position['SHOP'].id;
			model[productAdModelName].findOne({
				order: [
					[sequelize.literal('RAND()')]
				],
				limit: 1,
				where: queryObj
			}).then(function(row) {
				if (row) {
					model[productAdModelName].increment({
						'impression': 1
					}, {
						where: {
							id: row.id
						}
					}).then(function(updatedRow){
						console.log("Impression Response::", updatedRow);
					}).catch(function(error){
						console.log("Error::", error);
					})
					return callback(null, row.toJSON());
				} else {
					return callback(null);
				}
			}).catch(function(error) {
				return callback(error);
			});
		},
	}, function(err, results) {
		if (!err) {
			res.render('shop', {
				title: "Global Trade Connect",
				categories: results.categories,
				bottomCategory: bottomCategory,
				marketPlace: marketplace,
				featuredProducts: results.featuredProducts,
				publicMarketplace: results.publicMarketplace,
				retailers: results.retailers,
				cart: results.cartInfo,
				LoggedInUser: LoggedInUser,
				buyerCount:results.buyerCount,
				shopRandomAd:results.shopRandomAd
			});
		} else {
			res.render('shop', err);
		}
	});
}