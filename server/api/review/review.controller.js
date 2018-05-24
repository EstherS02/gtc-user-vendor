'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
const async = require('async');

export function starRating(req, res) {
	var field = "rating";
	var order = "desc"; //"asc"
	var offset = 0;
	var limit = 10;
	var vendor_id = 29;
	var review_type = 2;
	console.log('starRating');
	model['Review'].findAll({
		where: {
			vendor_id: vendor_id,
			review_type: review_type // 1 for product review and 2 for vendor review
		},
		offset: offset,
		limit: limit,
		order: [
			[field, order]
		],
		include: [{
			model: model['User']
		}]
	}).then(function(Reviews) {
		if (Reviews) {
			res.status(200).send(Reviews);
			return;
		} else {
			res.status(404).send("Not Found");
			return;
		}
	}).catch(function(error) {
		console.log('Error :::', error);
		return;
	});
	
}