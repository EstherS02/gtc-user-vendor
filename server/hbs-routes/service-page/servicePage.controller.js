'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');

export function servicePage(req, res) {

	var queryObj = {
		marketplace_id:3
	};
	var offset = 0;
	var limit = 20;
	var field = "id";
	var order = "asc";

	service.findRows('ProductSales', queryObj, offset, limit, field, order)
		.then(function(result) {
			console.log("result.rows",result.rows[0].product_name);
			
			res.render('servicePage', {
				title: 'Global Trade Connect',
				serviceProduct: result.rows,
				count:result.count
			});
		}).catch(function(error) {
			console.log('Error :::', error);
			res.status(500).send("Internal server error");
			return
		});
}