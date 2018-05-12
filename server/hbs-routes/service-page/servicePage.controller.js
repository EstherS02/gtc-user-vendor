'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');

export function servicePage(req, res) {

	var queryObj = {};
	var offset = 0;
	var limit = 2;
	var field = "id";
	var order = "asc";

	service.findRows('FeaturedproductProduct', queryObj, offset, limit, field, order)
		.then(function(result) {
			// console.log(result);
			console.log("result.rows",result.rows);
			
			res.render('servicePage', {
				title: 'Global Trade Connect',
				featuredProduct: result.rows
			});
		}).catch(function(error) {
			console.log('Error :::', error);
			res.status(500).send("Internal server error");
			return
		});
}