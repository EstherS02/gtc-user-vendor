'use strict';

const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const status = require('../../../config/status');
const verificationStatus = require('../../../config/verification_status');
const service = require('../../../api/service');
const productService = require('../../../api/product/product.service');
const marketplace = require('../../../config/marketplace');
const cartService = require('../../../api/cart/cart.service');
const shopService=require('../../../api/vendor/vendor.service')
const marketplace_type = require('../../../config/marketplace_type');
const Plan = require('../../../config/gtc-plan');
const sequelize = require('sequelize');
const moment = require('moment');
const async = require('async');
var _ = require('lodash');

export function vendorServices(req, res) {
	var LoggedInUser = {};

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;
	var vendorModel = "VendorUserProduct";
	var categoryModel = "Category";
	var offset, limit, field, order, page;
	var queryObj = {};
	var queryURI = {};
	var bottomCategory = {};
	var vendor_id = req.params.id;
	queryObj['marketplace_id'] = marketplace['SERVICE'];
	queryURI['marketplace_id'] = marketplace['SERVICE'];
	queryObj['status'] = status['ACTIVE'];
	queryObj['vendor_id'] = vendor_id;

	var queryPaginationObj = {};

	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	queryPaginationObj['offset'] = offset;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 20;
	queryPaginationObj['limit'] = limit;
	delete req.query.limit;
	field = req.query.field ? req.query.field : "created_on";
	queryPaginationObj['field'] = field;
	delete req.query.field;
	order = req.query.order ? req.query.order : "desc";
	queryPaginationObj['order'] = order;
	queryURI['order'] = order;
	delete req.query.order;

	page = req.query.page ? parseInt(req.query.page) : 1;
	queryPaginationObj['page'] = page;
	queryURI['page'] = page;
	delete req.query.page;

	offset = (page - 1) * limit;
	queryPaginationObj['offset'] = offset;


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
		serviceMarketplace: function(callback) {
			productService.queryAllProducts(LoggedInUser.id, queryObj, offset, limit, field, order)
				.then(function(serviceMarketplace) {
					return callback(null, serviceMarketplace);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		VendorDetail: function(callback) {
			var vendorIncludeArr = [{
				model: model['Country']

			}, {
				model: model['VendorPlan'],
				where: {
						status: status['ACTIVE'],
						start_date: {
							'$lte': moment().format('YYYY-MM-DD')
						},
						end_date: {
							'$gte': moment().format('YYYY-MM-DD')
						}
					},

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
			productCountQueryParames['marketplace_id'] = marketplace['SERVICE'];
			service.getCategory(categoryQueryObj, productCountQueryParames)
				.then(function(response) {
					return callback(null, response);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		categoryWithProductCount: function(callback) {
			var resultObj = {};
			var categoryWithProductCount = {};
			shopService.vendorProductCountForFilter(queryObj)
				.then(function(response) {
					var char = JSON.parse(JSON.stringify(response));
					var count = 0;
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
						count= count + o.subproductcount;
					})
					categoryWithProductCount.rows = resultObj;
					categoryWithProductCount.count = count;
					return callback(null, categoryWithProductCount);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
	}, function(err, results) {
		queryPaginationObj['maxSize'] = 5;

		if (!err && results.VendorDetail) {
			res.render('vendorPages/vendor-services', {
				title: "Global Trade Connect",
				VendorDetail: results.VendorDetail,
				marketPlace: marketplace,
				marketPlaceType: marketplace_type,
				serviceMarketplace: results.serviceMarketplace,
				queryPaginationObj: queryPaginationObj,
				queryURI: queryURI,
				page: page,
				categories: results.categories,
				categoriesWithCount: results.categoriesWithCount,
				bottomCategory: bottomCategory,
				cart: results.cartInfo,
				LoggedInUser: LoggedInUser,
				selectedPage: 'services',
				Plan: Plan,
				categoryWithProductCount:results.categoryWithProductCount
			});
		} else {
			res.render('vendor-services', err);
		}
	});
}