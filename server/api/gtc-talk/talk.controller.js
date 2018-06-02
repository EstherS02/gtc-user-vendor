'use strict';

const crypto = require('crypto');
const uuid = require('node-uuid');
const expressValidator = require('express-validator');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const status = require('../../config/status');
const service = require('../service');

export function workingHours(req,res){
	const data = req.body;
	const modelName = 'BusinessHour';
	var includeArr = [];
	var queryObj = {
		vendor_id :29,
		from_day:1,
		to_day:5,
		start_time:9,
		end_time:18,
		timezone_id:1,
		status:1
	};

	service.findOneRow(modelName, queryObj, includeArr)
		.then(function(results) {
			console.log("WishList", results);
			if (results) {
				res.status(200).send(results);
				return;
			} else {
				res.status(404).send("Unable to delete");
				return;
			}
		}).catch(function(error) {
			console.log('Error:::', error);
			res.status(500).send("Internal server error");
			return;
		});
}