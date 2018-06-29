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
			productCountQueryParames['marketplace_id'] =marketplace['LIFESTYLE'];
			productCountQueryParames['status'] = status["ACTIVE"];
			productCountQueryParames['vendor_id'] = vendor_id;
			// if (req.query.marketplace) {
			// 	productCountQueryParames['marketplace_id'] = req.query.marketplace;
			// }
			// if (req.query.keyword) {
			// 	productCountQueryParames['product_name'] = {
			// 		like: '%' + req.query.keyword + '%'
			// 	};
			// }

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
		console.log(results);

		if (!err) {
			res.render('vendor-lifestyle', {
				title: "Global Trade Connect",
				VendorDetail : results.VendorDetail,
				marketPlace: marketplace,
				marketPlaceType: marketplace_type,
				publicLifestyle: results.publicLifestyle,
				categories: results.categories,
				LoggedInUser: LoggedInUser
			});
		} else {
			res.render('vendor-lifestyle', err);
		}
	});



}