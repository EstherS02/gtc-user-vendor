'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');

export function servicePage(req, res) {

	var queryObj = {
		marketplace: 'Service Marketplace'
	};
	var field = "id";
	var order = "asc";


	service.findRows('FeaturedproductProduct', queryObj, 0, 4, field, order)
		.then(function (featuredService) {
			
			service.findRows('ProductSales', queryObj, 0, 20, field, order)
				.then(function (serviceProduct) {

					console.log("featuredService.rows",featuredService.rows);
			
					res.render('servicePage', {
						title: 'Global Trade Connect',
						featuredService:featuredService.rows,
						serviceProduct: serviceProduct.rows,
						count: serviceProduct.count
					});

				}).catch(function (error) {
					console.log('Error :::', error);
					res.status(500).send("Internal server error");
					return
				});

		}).catch(function (error) {
			console.log('Error :::', error);
			res.status(500).send("Internal server error");
			return
		});

}









