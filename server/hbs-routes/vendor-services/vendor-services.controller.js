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
	var offset, limit, field, order;
	var queryObj = {};
	var vendor_id = req.params.id;
	queryObj['marketplace_id'] = marketplace['SERVICE'];
	queryObj['vendor_id'] = vendor_id;
	// var vevndorIncludeArr = [{
	// 	model:model['Country']

	// }]


	offset = 0;
	limit = 9;
	field = "id";
	order = "asc";

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
		console.log(JSON.stringify(results.VendorDetail));

		if (!err) {
			res.render('vendor-services', {
				title: "Global Trade Connect",
				VendorDetail: results.VendorDetail,
				marketPlace: marketplace,
				marketPlaceType: marketplace_type,
				publicService: results.publicService,
				categories: results.categories,
				LoggedInUser: LoggedInUser,
				selectedPage: 'services'
			});
		} else {
			res.render('vendor-services', err);
		}
	});


}