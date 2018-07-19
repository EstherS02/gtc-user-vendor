'use strict';

const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const reference = require('../../../config/model-reference');
const status = require('../../../config/status');
const service = require('../../../api/service');
const marketplace = require('../../../config/marketplace');
const marketplace_type = require('../../../config/marketplace_type');
const sequelize = require('sequelize');
const moment = require('moment');
import series from 'async/series';
var async = require('async');

export function vendorServices(req, res) {
	var LoggedInUser = {};

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;
	var productModel = "MarketplaceProduct";
	var vendorModel = "VendorUserProduct";
	var categoryModel = "Category";
	var offset, limit, field, order,page;
	var queryObj = {};
	var queryURI = {};
	var bottomCategory = {};
	var vendor_id = req.params.id;
	queryObj['marketplace_id'] = marketplace['SERVICE'];
	queryURI['marketplace_id'] = marketplace['SERVICE'];
	queryObj['vendor_id'] = vendor_id;
	// var vevndorIncludeArr = [{
	// 	model:model['Country']

	// }]

	var queryPaginationObj = {};
	// var queryURI = {};

	// offset = 0;
	// limit = 18;
	// field = "created_on";
	// order = 0;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	queryPaginationObj['offset'] = offset;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 20;
	queryPaginationObj['limit'] = limit;
	delete req.query.limit;
	field = req.query.field ? req.query.field : "created_on";
	queryPaginationObj['field'] = field;
	delete req.query.field;
	order = req.query.order ? req.query.order : "asc";
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
		publicService: function(callback) {
			service.findRows(productModel, queryObj, offset, limit, field, order)
				.then(function(response) {
					return callback(null, response);

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
				required:false
			}, {
				model: model['VendorVerification'],
				where: {
					vendor_verified_status: status['ACTIVE']
				},
				required:false
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
			productCountQueryParames['marketplace_id'] = marketplace['LIFESTYLE'];
			productCountQueryParames['status'] = status["ACTIVE"];
			productCountQueryParames['vendor_id'] = vendor_id;
			service.getCategory(categoryQueryObj, productCountQueryParames)
				.then(function(response) {
					var categories = response.rows;
					bottomCategory['left'] = categories.slice(0, 8);
					bottomCategory['right'] = categories.slice(8, 16);
					return callback(null, response);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		}
	}, function(err, results) {
		// console.log(JSON.stringify(results.VendorDetail));
		queryPaginationObj['maxSize'] = 5;

		if (!err) {
			res.render('vendorPages/vendor-services', {
				title: "Global Trade Connect",
				VendorDetail: results.VendorDetail,
				marketPlace: marketplace,
				marketPlaceType: marketplace_type,
				publicService: results.publicService,
				queryPaginationObj: queryPaginationObj,
				queryURI: queryURI,
				page:page,
				categories: results.categories.rows,
				category: results.categories,
				bottomCategory: bottomCategory,
				LoggedInUser: LoggedInUser,
				selectedPage: 'services'
			});
		} else {
			res.render('vendor-services', err);
		}
	});


}