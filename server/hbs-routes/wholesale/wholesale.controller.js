'use strict';

const sequelize = require('sequelize');
const populate = require('../../utilities/populate')
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const status = require('../../config/status');
const service = require('../../api/service');
const marketplace = require('../../config/marketplace');
const cartService = require('../../api/cart/cart.service');
const marketplace_type = require('../../config/marketplace_type');
const productService = require('../../api/product/product.service');
const async = require('async');

export function wholeSaleProductView(req, res) {
	var modeName = "Product";
	var queryObj = {};
	var includeArr = [];

	queryObj['product_slug'] = req.params.productSlugName;
	queryObj['status'] = status["ACTIVE"];

	includeArr = populate.populateData("Marketplace,MarketplaceType,Category,SubCategory,Country,State")

	service.findOneRow(modeName, queryObj, includeArr)
		.then(function(product) {
			console.log('product', product);
			res.render('product-view', {
				title: "Global Trade Connect"
			});
		})
		.catch(function(error) {
			console.log('Error:::', error);
			res.render('product-view', err);
		})
}

export function wholesale(req, res) {
	var vendorModel = "VendorUserProduct";
	var categoryModel = "Category";
	var countryModel = "Country";
	var typeModel = "MarketplaceType";
	var offset, limit, field, order;
	var queryObj = {};
	var LoggedInUser = {};
	var bottomCategory = {};

	offset = 0;
	limit = 20;
	field = "id";
	order = "asc";

	queryObj['status'] = status["ACTIVE"];

	if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable)
		LoggedInUser = req.gtcGlobalUserObj;

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
		wantToSell: function(callback) {
			queryObj['marketplace_id'] = marketplace['WHOLESALE'];
			queryObj['marketplace_type_id'] = marketplace_type['WTS'];
			productService.queryAllProducts(LoggedInUser.id, queryObj, offset, limit, field, order)
				.then(function(wantToSell) {
					return callback(null, wantToSell.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		wantToBuy: function(callback) {
			queryObj['marketplace_id'] = marketplace['WHOLESALE'];
			queryObj['marketplace_type_id'] = marketplace_type['WTB'];
			productService.queryAllProducts(LoggedInUser.id, queryObj, offset, limit, field, order)
				.then(function(wantToBuy) {
					return callback(null, wantToBuy.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		wantToTrade: function(callback) {
			queryObj['marketplace_id'] = marketplace['WHOLESALE'];
			queryObj['marketplace_type_id'] = marketplace_type['WTT'];
			productService.queryAllProducts(LoggedInUser.id, queryObj, offset, limit, field, order)
				.then(function(wantToTrade) {
					return callback(null, wantToTrade.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		requestForQuote: function(callback) {
			queryObj['marketplace_id'] = marketplace['WHOLESALE'];
			queryObj['marketplace_type_id'] = marketplace_type['RFQ'];
			productService.queryAllProducts(LoggedInUser.id, queryObj, offset, limit, field, order)
				.then(function(requestForQuote) {
					return callback(null, requestForQuote.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		featuredProducts: function(callback) {
			const tempLimit = 6;
			delete queryObj['marketplace_type_id'];
			queryObj['position'] = 'position_wholesale_landing';
			queryObj['is_featured_product'] = 1;

			productService.queryAllProducts(LoggedInUser.id, queryObj, 0, tempLimit)
				.then(function(results) {
					return callback(null, results);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});

		},
		country: function(callback) {
			const tempLimit = null;
			delete queryObj['marketplace_id'];
			delete queryObj['position'];
			delete queryObj['is_featured_product'];

			service.findRows(countryModel, queryObj, offset, tempLimit, field, order)
				.then(function(country) {
					return callback(null, country.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		type: function(callback) {
			const tempLimit = null;

			service.findRows(typeModel, queryObj, offset, tempLimit, field, order)
				.then(function(type) {
					return callback(null, type.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		wholesalers: function(callback) {
			var result = {};
			const tempLimit = 6;
			queryObj['type'] = 'Private Wholesale Marketplace';
			field = 'sales_count';
			order = 'desc';

			service.findRows(vendorModel, queryObj, offset, tempLimit, field, order)
				.then(function(wholesalers) {
					result.rows = JSON.parse(JSON.stringify(wholesalers.rows));
					var vendorAvgRating = {};
					vendorAvgRating['status'] = {
						'$eq': status["ACTIVE"]
					}
					async.mapSeries(result.rows, function(aVendor, cb) {
						vendorAvgRating['vendor_id'] = aVendor.id;
						model['ProductRating'].findOne({
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
							// console.log('providers', result.rows);
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
			res.render('wholesale', {
				title: "Global Trade Connect",
				categories: results.categories,
				bottomCategory: bottomCategory,
				marketPlace: marketplace,
				marketPlaceType: marketplace_type,
				wantToSell: results.wantToSell,
				wantToBuy: results.wantToBuy,
				wantToTrade: results.wantToTrade,
				requestForQuote: results.requestForQuote,
				featuredProducts: results.featuredProducts,
				wholesalers: results.wholesalers,
				country: results.country,
				cart: results.cartInfo,
				type: results.type,
				LoggedInUser: LoggedInUser
			});
		} else {
			res.render('wholesale', err);
		}
	});
}