'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const marketplace = require('../../config/marketplace');
const marketplace_type = require('../../config/marketplace_type');
const status = require('../../config/status');
const service = require('../../api/service');
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
	var vendor_id = req.params.id;
	queryObj['marketplace_id'] = marketplace['SERVICE'];
	queryObj['vendor_id'] = vendor_id;
	// var vevndorIncludeArr = [{
	// 	model:model['Country']

	// }]

	var queryPaginationObj = {};
	var queryURI = {};

	offset = 0;
	limit = 18;
	field = "id";
	order = 0;
	queryPaginationObj['offset'] = offset;
	queryPaginationObj['limit'] = limit;
	queryPaginationObj['field'] = field;
	order = req.query.order ? req.query.order : "asc";
	queryPaginationObj['order'] = order;
	delete req.query.order;
	page = req.query.page ? parseInt(req.query.page) : 1;
	queryPaginationObj['page'] = page;
	queryURI['page'] = page;

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

			}, {
				model: model['User'],
				attributes:['id'],
				include: [{
					model: model['VendorVerification'],
					where: {
						vendor_verified_status: status['ACTIVE']
					}
				}]

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

			productCountQueryParames['status'] = status["ACTIVE"];
			productCountQueryParames['vendor_id'] = vendor_id;
			if (req.query.marketplace) {
				productCountQueryParames['marketplace_id'] = req.query.marketplace;
			}
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
		}
	}, function(err, results) {
		// console.log(JSON.stringify(results.VendorDetail));
		queryPaginationObj['maxSize'] = 5;

		if (!err) {
			res.render('vendor-services', {
				title: "Global Trade Connect",
				VendorDetail: results.VendorDetail,
				marketPlace: marketplace,
				marketPlaceType: marketplace_type,
				publicService: results.publicService,
				queryPaginationObj: queryPaginationObj,
				queryURI: queryURI,
				page:page,
				categories: results.categories,
				LoggedInUser: LoggedInUser,
				selectedPage: 'services'
			});
		} else {
			res.render('vendor-services', err);
		}
	});


}