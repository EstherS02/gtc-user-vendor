'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const position = require('../../config/position');
const marketplace = require('../../config/marketplace');
const service = require('../../api/service');
const async = require('async');


export function services(req, res) {
	var productModel = "MarketplaceProduct";
	var vendorModel = "VendorUserProduct";
	var offset, limit, field, order;
	var queryObj = {};
	var LoggedInUser = {}

    if(req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable)
        LoggedInUser = req.gtcGlobalUserObj;

	offset = 0;
	field = "id";
	order = "asc";

	queryObj['status'] = status["ACTIVE"];
	queryObj['marketplace_id'] = 3;

	async.series({
		featuredService: function(callback) {
			limit = null;
			queryObj['featured_position'] = position.ServiceLanding;
			queryObj['is_featured_product'] = 1;
			service.findRows(productModel, queryObj, offset, limit, field, order)
				.then(function(featuredService) {
					return callback(null, featuredService.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		serviceProduct: function(callback) {
			delete queryObj['featured_position'];
            delete queryObj['is_featured_product'];
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
			delete queryObj['marketplace_id'];
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
				marketPlace: marketplace,
				featuredService: results.featuredService,
				serviceProduct: results.serviceProduct,
				servicesProviders: results.servicesProviders,
				LoggedInUser: LoggedInUser
			});
		} else {
			res.render('services', err);
		}
	});
}