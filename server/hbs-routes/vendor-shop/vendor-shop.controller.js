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

export function vendorShop(req, res) {
	var LoggedInUser = {};

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;

	var productModel = "MarketplaceProduct";
	var vendorModel = "VendorUserProduct";
	var categoryModel = "Category";
	var offset, limit, field, order,page;
	var queryPaginationObj = {};
	var queryObj = {};
	var queryURI = {};
	var vendor_id = req.params.id;
	queryObj['marketplace_id'] = marketplace['PUBLIC'];
	queryObj['vendor_id'] = vendor_id;

	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	queryPaginationObj['offset'] = offset;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 20;
	queryPaginationObj['limit'] = limit;
	delete req.query.limit;
	field = req.query.field ? req.query.field : "id";
	queryPaginationObj['field'] = field;
	delete req.query.field;
	order = req.query.order ? req.query.order : "asc";
	queryPaginationObj['order'] = order;
	delete req.query.order;

	page = req.query.page ? parseInt(req.query.page) : 1;
	queryPaginationObj['page'] = page;
	queryURI['page'] = page;
	delete req.query.page;

	offset = (page - 1) * limit;
	queryPaginationObj['offset'] = offset;

	async.series({
		publicShop: function(callback) {
			service.findRows(productModel, queryObj, offset, limit, field, order)
				.then(function(wantToSell) {
					return callback(null, wantToSell);

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

			}, {
				model: model['User'],
				attributes:['id'],
				include: [{
					model: model['VendorVerification'],
					where: {
						vendor_verified_status: status['ACTIVE']
					}
				}]

			}, {
				model: model['VendorFollower'],
				where: {
					user_id: req.user.id,
					status: 1
				},
				required: false
			},{
				model:model['VendorRating'],
				attributes:[ [sequelize.fn('AVG', sequelize.col('VendorRatings.rating')), 'rating']],
				group: ['VendorRating.vendor_id'],
				required:false,
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
			var categoryQueryObj = {};
			var productCountQueryParames = {};

			categoryQueryObj['status'] = status["ACTIVE"];
			productCountQueryParames['marketplace_id'] =  marketplace['PUBLIC'];
			productCountQueryParames['status'] = status["ACTIVE"];
			productCountQueryParames['vendor_id'] = vendor_id;
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

			model['Category'].findAll({
				where: categoryQueryObj,
				include: [{
					model: model['SubCategory'],
					where: categoryQueryObj,
					attributes: ['id', 'category_id', 'name', 'code'],
					include: [{
						model: model['Product'],
						where: productCountQueryParames,
						attributes: []
					}]
				}, {
					model: model['Product'],
					where: productCountQueryParames,
					attributes: []
				}],
				attributes: ['id', 'name', 'code', [sequelize.fn('count', sequelize.col('Products.id')), 'product_count']],
				group: ['SubCategories.id']
			}).then(function(results) {
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
		queryPaginationObj['maxSize'] = 5;
		if (!err) {
			res.render('vendor-shop', {
				title: "Global Trade Connect",
				queryPaginationObj: queryPaginationObj,
				VendorDetail : results.VendorDetail,
				marketPlace: marketplace,
				queryURI:queryURI,
				marketPlaceType: marketplace_type,
				publicShop: results.publicShop,
				categories: results.categories,
				LoggedInUser: LoggedInUser,
				selectedPage:'shop'
			});
		} else {
			res.render('vendor-shop', err);
		}
	});



}