'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');

const async = require('async');
import series from 'async/series';

export function Service(req, res) {

	var field = "id";
	var order = "desc";

	async.series({
		vendors: function (callback) {

			service.findRows('VendorSales', { status:1 }, 0, 4, field, order)
				.then(function (vendors) {
					return callback(null, vendors.rows);

				}).catch(function (error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		featuredService: function (callback) {

			service.findRows('FeaturedproductSalesRating', { status:1, marketplace: 'Service Marketplace' }, 0, 4, field, order)
				.then(function (featuredService) {
					return callback(null, featuredService.rows);

				}).catch(function (error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		serviceProduct: function (callback) {

			service.findRows('ProductSalesRating', { status:1, marketplace: 'Service Marketplace' }, 0, 20, field, order)
				.then(function (serviceProduct) {
					return callback(null, serviceProduct.rows);

				}).catch(function (error) {
					console.log('Error :::', error);
					return callback(null);
				});
		}

	}, function (err, results) {
		if (!err) {
			res.render('service', results);
		}
		else {
			res.render('service', err);
		}
	});

}









