'use strict';

const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const reference = require('../../../config/model-reference');
const status = require('../../../config/status');
const verificationStatus = require('../../../config/verification_status');
const service = require('../../../api/service');
const productService = require('../../../api/product/product.service');
const sequelize = require('sequelize');
const marketplace = require('../../../config/marketplace');
const cartService = require('../../../api/cart/cart.service');
const shopService=require('../../../api/vendor/vendor-service')
const Plan = require('../../../config/gtc-plan');
const marketplace_type = require('../../../config/marketplace_type');
const moment = require('moment');
import series from 'async/series';
var async = require('async');
var _ = require('lodash');

export function vendorWholesale(req, res) {
	var LoggedInUser = {};

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;
	var bottomCategory = {};
	var vendorProductCategoryCount = {};

	var productModel = "MarketplaceProduct";
	var vendorModel = "VendorUserProduct";
	var categoryModel = "Category";
	var offset, limit, field, order, page;
	var queryObj = {};
	var vendor_id;
	queryObj['status'] = status['ACTIVE'];
	queryObj['marketplace_id'] = marketplace['WHOLESALE'];
	vendorProductCategoryCount['marketplace_id'] = marketplace['WHOLESALE'];
	if (req.params.id) {
		queryObj['vendor_id'] = req.params.id;
		vendorProductCategoryCount['vendor_id'] = req.params.id;
		vendor_id = req.params.id;
	} else if (req.query.vendor_id) {
		queryObj['vendor_id'] = req.query.vendor_id;
		vendorProductCategoryCount['vendor_id'] = req.params.id;
		vendor_id = req.query.vendor_id;
	} else {
		vendor_id = 0;
	}
	var queryURI = {};
	queryURI['marketplace_id'] = marketplace['WHOLESALE'];
	field = req.query.field ? req.query.field : "created_on";
	delete req.query.field;
	order = req.query.order ? req.query.order : "desc";
	queryURI['order'] = order;
	delete req.query.order;
	page = req.query.page ? parseInt(req.query.page) : 1;
	queryURI['page'] = page;

	offset = 0;
	limit = 9;
	// field = "created_on";
	// order = "asc";

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
		wantToSell: function(callback) {
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
			queryObj['marketplace_type_id'] = marketplace_type['RFQ'];
			productService.queryAllProducts(LoggedInUser.id, queryObj, offset, limit, field, order)
				.then(function(requestForQuote) {
					return callback(null, requestForQuote.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		vendorDetail: function(callback) {
			var vendorIncludeArr = [{
				model: model['Country']

			}, {
				model: model['VendorPlan'],
				required: false
			}, {
				model: model['VendorVerification'],
				where: {
					// vendor_verified_status: status['ACTIVE']
					vendor_verified_status: verificationStatus['APPROVED']
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
					[sequelize.fn('AVG', sequelize.col('VendorRatings.rating')), 'rating'],
					[sequelize.fn('count', sequelize.col('VendorRatings.rating')), 'count']
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
		categoriesWithCount: function(callback) {
			var result = {};
			var categoryQueryObj = {};
			var productCountQueryParames = {};

			categoryQueryObj['status'] = status["ACTIVE"];
			productCountQueryParames['status'] = status["ACTIVE"];
			productCountQueryParames['vendor_id'] = vendor_id;
			productCountQueryParames['marketplace_id'] = marketplace['WHOLESALE'];

			service.getCategory(categoryQueryObj, productCountQueryParames)
				.then(function(response) {
					return callback(null, response);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		marketPlaceTypes: function(callback) {
			var result = {};
			var marketplaceTypeQueryObj = {};
			var productCountQueryParames = {};

			marketplaceTypeQueryObj['status'] = status["ACTIVE"];
			productCountQueryParames['vendor_id'] = vendor_id;
			marketplaceTypeQueryObj['marketplace_id'] = marketplace['WHOLESALE'];

			productCountQueryParames['status'] = status["ACTIVE"];
			productCountQueryParames['marketplace_id'] = marketplace['WHOLESALE'];
			if (req.query.location) {
				productCountQueryParames['product_location'] = req.query.location;
			}
			if (req.query.category) {
				productCountQueryParames['product_category_id'] = req.query.category;
			}
			if (req.query.sub_category) {
				productCountQueryParames['sub_category_id'] = req.query.sub_category;
			}
			if (req.query.keyword) {
				productCountQueryParames['product_name'] = {
					like: '%' + req.query.keyword + '%'
				};
			}
			service.getMarketPlaceTypes(marketplaceTypeQueryObj, productCountQueryParames)
				.then(function(response) {
					return callback(null, response);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});

		},
		categoryWithProductCount: function(callback) {
			var resultObj = {};
			shopService.vendorProductCountForFilter(queryObj)
				.then(function(response) {
					var char = JSON.parse(JSON.stringify(response));
					_.each(char, function(o) {
						if (_.isUndefined(resultObj[o.categoryname])) {
							resultObj[o.categoryname] = {};
							resultObj[o.categoryname]["categoryName"] = o.categoryname;
							resultObj[o.categoryname]["categoryID"] = o.categoryid;
							resultObj[o.categoryname]["count"] = 0;
							resultObj[o.categoryname]["subCategory"] = [];

						}
						var subCatObj = {}
						subCatObj["subCategoryName"] = o.subcategoryname;
						subCatObj["subCategoryId"] = o.subcategoryid;
						subCatObj["count"] = o.subproductcount;
						resultObj[o.categoryname]["count"] += Number(o.subproductcount);
						resultObj[o.categoryname]["subCategory"].push(subCatObj)
					})
					return callback(null, resultObj);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
	}, function(err, results) {
		if (!err) {
			res.render('vendorPages/vendor-wholesale', {
				title: "Global Trade Connect",
				VendorDetail: results.vendorDetail,
				marketPlace: marketplace,
				marketPlaceType: marketplace_type,
				marketPlaceTypes: results.marketPlaceTypes,
				wantToSell: results.wantToSell,
				wantToBuy: results.wantToBuy,
				wantToTrade: results.wantToTrade,
				queryURI: queryURI,
				requestForQuote: results.requestForQuote,
				categories: results.categories,
				categoriesWithCount: results.categoriesWithCount,
				bottomCategory: bottomCategory,
				cart: results.cartInfo,
				LoggedInUser: LoggedInUser,
				selectedPage: 'wholesale',
				Plan: Plan,
				categoryWithProductCount:results.categoryWithProductCount
			});
		} else {
			res.render('vendor-wholesale', err);
		}
	});
}