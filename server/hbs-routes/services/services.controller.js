'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const position = require('../../config/position');
const service = require('../../api/service');
const async = require('async');


export function services(req, res) {
	var productModel = "ProductSalesRating";
	var featuredProductModel = "FeaturedproductSalesRating";
	var vendorModel = "VendorUserProduct";
	var offset, limit, field, order;
	var queryObj = {};

	offset = 0;
	field = "id";
	order = "asc";

	queryObj['status'] = status["ACTIVE"];
	queryObj['marketplace'] = 'Services Marketplace';

	async.series({
		featuredService: function(callback) {
			limit = null;
			queryObj['position'] = position.ServiceLanding;
			service.findRows(featuredProductModel, queryObj, offset, limit, field, order)
				.then(function(featuredService) {
					return callback(null, featuredService.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		serviceProduct: function(callback) {
			delete queryObj['position'];
			limit = 20;
			service.findRows(productModel, queryObj, offset, limit, field, order)
				.then(function(serviceProduct) {
					return callback(null, serviceProduct.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		servicesProviders: function(callback) {
			delete queryObj['marketplace'];
			queryObj['type'] = 'Services Marketplace';
			field = 'sales_count';
			order = 'desc';
			limit = 6;
			service.findRows(vendorModel, queryObj, offset, limit, field, order)
				.then(function(servicesProviders) {
					return callback(null, servicesProviders.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		}
	}, function(err, results) {
		if (!err) {
			res.render('services', {
				title: "Global Trade Connect",
				featuredService: results.featuredService,
				serviceProduct: results.serviceProduct,
				servicesProviders: results.servicesProviders
			});
		} else {
			res.render('services', err);
		}
	});
}