'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');
const async = require('async');


export function services(req, res) {
	var productModel = "ProductSalesRating";
	var featuredProductModel = "FeaturedproductSalesRating";
	var offset, limit, field, order;
	var queryObj = {};

	offset = 0;
	limit = 5;
	field = "id";
	order = "asc";

	queryObj['status'] = status["ACTIVE"];
	queryObj['marketplace'] = 'Services Marketplace';

	async.series({
		featuredService: function (callback) {
			service.findRows(featuredProductModel, queryObj, offset, limit, field, order)
				.then(function (featuredService) {
					return callback(null, featuredService.rows);

				}).catch(function (error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		serviceProduct: function (callback) {
			service.findRows(productModel, queryObj, offset, 20, field, order)
				.then(function (serviceProduct) {
					return callback(null, serviceProduct.rows);

				}).catch(function (error) {
					console.log('Error :::', error);
					return callback(null);
				});
		}
	}, function (err, results) {
		if (!err) {
			res.render('services', {
				title: "Global Trade Connect",
				featuredService: results.featuredService,
				serviceProduct: results.serviceProduct
			});
		}
		else {
			res.render('services', err);
		}
	});

}









