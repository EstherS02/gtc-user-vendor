'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
var async = require('async');

export function selectVendorplan(req, res) {
	var modelName = 'Plan';
	var queryObj = {};
	queryObj = {
		id: req.params.id
	};
	var includeArr = [];

	service.findRow(modelName, queryObj, includeArr)
	.then(function(response) {
		if (response) {
			return res.status(200).json({
				data: response
			});
		} else {
			return res.status(404).send('Not Found.');
		}
	}).catch(function(error){
		console.log("Error::",error);
		return res.status(500).send('Internal Server Error.');
	})	
}