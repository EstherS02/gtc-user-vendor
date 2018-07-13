'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');
const sequelize = require('sequelize');
const marketplace = require('../../config/marketplace');
const marketplace_type = require('../../config/marketplace_type');
const moment = require('moment');
import series from 'async/series';
var async = require('async');

export function vendorWholesale(req, res) {
	var LoggedInUser = {};

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;

	var productModel = "MarketplaceProduct";
	var vendorModel = "VendorUserProduct";
	var categoryModel = "Category";
	var offset, limit, field, order, page;
	var queryObj = {};
	var vendor_id;
	queryObj['marketplace_id'] = marketplace['WHOLESALE'];
	if (req.params.id) {
		queryObj['vendor_id'] = req.params.id;
		vendor_id = req.params.id;
	} else if (req.query.vendor_id) {
		queryObj['vendor_id'] = req.query.vendor_id;
		vendor_id = req.query.vendor_id;
	} else {
		vendor_id = 0;
	}
	var queryURI = {};
	queryURI['marketplace_id'] = marketplace['WHOLESALE'];
	field = req.query.field ? req.query.field : "created_on";
	delete req.query.field;
	order = req.query.order ? req.query.order : "asc";
	queryURI['order'] = order;
	delete req.query.order;
	page = req.query.page ? parseInt(req.query.page) : 1;
	queryURI['page'] = page;

	offset = 0;
	limit = 9;
	// field = "created_on";
	// order = "asc";

	async.series({
		wantToSell: function(callback) {

			queryObj['marketplace_type_id'] = marketplace_type['WTS'];
			service.findRows(productModel, queryObj, offset, limit, field, order)
				.then(function(wantToSell) {
					return callback(null, wantToSell.rows);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		wantToBuy: function(callback) {
			queryObj['marketplace_type_id'] = marketplace_type['WTB'];
			service.findRows(productModel, queryObj, offset, limit, field, order)
				.then(function(wantToBuy) {
					return callback(null, wantToBuy.rows);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		wantToTrade: function(callback) {
			queryObj['marketplace_type_id'] = marketplace_type['WTT'];
			service.findRows(productModel, queryObj, offset, limit, field, order)
				.then(function(wantToTrade) {
					return callback(null, wantToTrade.rows);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		requestForQuote: function(callback) {
			queryObj['marketplace_type_id'] = marketplace_type['RFQ'];
			service.findRows(productModel, queryObj, offset, limit, field, order)
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
				required:false
			}, {
				model: model['VendorVerification'],
				where: {
					vendor_verified_status: status['ACTIVE']
				},
				required:false
			}, {
				model: model['VendorFollower'],
				where: {
					user_id: req.user.id,
					status: 1
				},
				required: false
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
			var result = {};
			var queryPaginationObj = {};
			var categoryQueryObj = {};
			var productCountQueryParames = {};
			productCountQueryParames['marketplace_id'] = marketplace['WHOLESALE']
			categoryQueryObj['status'] = status["ACTIVE"];

			productCountQueryParames['status'] = status["ACTIVE"];
			productCountQueryParames['vendor_id'] = vendor_id;
			// if (req.query.marketplace) {
			// 	productCountQueryParames['marketplace_id'] = req.query.marketplace;
			// }
			if (req.query.marketplace_type) {
				productCountQueryParames['marketplace_type_id'] = req.query.marketplace_type;
			}
			if (req.query.location) {
				productCountQueryParames['product_location'] = req.query.location;
			}
			if (req.query.keyword) {
				productCountQueryParames['product_name'] = {
					like: '%' + req.query.keyword + '%'
				};
			}
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

			model['MarketplaceType'].findAll({
				where: marketplaceTypeQueryObj,
				include: [{
					model: model['Product'],
					where: productCountQueryParames,
					attributes: [],
					required: false
				}],
				attributes: ['id', 'name', 'code', [sequelize.fn('count', sequelize.col('Products.id')), 'product_count']],
				group: ['MarketplaceType.id']
			}).then(function(results) {
				console.log("results", results)
				if (results.length > 0) {
					model['Product'].count({
						where: productCountQueryParames
					}).then(function(count) {
						result.count = count;
						result.rows = JSON.parse(JSON.stringify(results));
						return callback(null, result);
					}).catch(function(error) {
						console.log('Error:::', error);
						return callback(error, null);
					});
				} else {
					result.count = 0;
					result.rows = [];
					return callback(null, result);
				}
			}).catch(function(error) {
				console.log('Error:::', error);
				return callback(error, null);
			});
		}
	}, function(err, results) {
		console.log((results.marketPlaceTypes))
		if (!err) {
			res.render('vendor-wholesale', {
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
				LoggedInUser: LoggedInUser,
				selectedPage: 'wholesale'
			});
		} else {
			res.render('vendor-wholesale', err);
		}
	});

	// res.render('vendor-wholesale', {
	//     title: "Global Trade Connect",
	//     LoggedInUser: LoggedInUser
	// });

}