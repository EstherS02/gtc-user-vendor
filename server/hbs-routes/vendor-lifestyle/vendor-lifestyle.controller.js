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

export function vendorLifestyle(req, res) {
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
	queryObj['marketplace_id'] = marketplace['LIFESTYLE'];
	queryObj['vendor_id'] = vendor_id;
	queryObj['status'] = status["ACTIVE"];
	// var vevndorIncludeArr = [{
	// 	model:model['Country']

	// }]

	offset = 0;
	limit = 20;
	field = "id";
	order = "asc";

	async.series({
		publicLifestyle: function(callback) {
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
				include: [{
					model: model['VendorVerification'],
					where: {
						vendor_verified_status: status['ACTIVE']
					}
				}],
				attributes: ['id']

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
			productCountQueryParames['marketplace_id'] = marketplace['LIFESTYLE'];
			productCountQueryParames['status'] = status["ACTIVE"];
			productCountQueryParames['vendor_id'] = vendor_id;
			service.getCategory(categoryQueryObj, productCountQueryParames)
				.then(function(response) {
					return callback(null, response);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		}
	}, function(err, results) {
		console.log(results);

		if (!err) {
			res.render('vendor-lifestyle', {
				title: "Global Trade Connect",
				VendorDetail: results.VendorDetail,
				marketPlace: marketplace,
				marketPlaceType: marketplace_type,
				publicLifestyle: results.publicLifestyle,
				categories: results.categories,
				LoggedInUser: LoggedInUser,
				selectedPage: 'lifestyle'
			});
		} else {
			res.render('vendor-lifestyle', err);
		}
	});



}