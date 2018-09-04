'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
var async = require('async');


export function selectVendorplan(req, res) {
	var modelName = 'Plan';
	console.log("enter the loops");
	console.log("idd:::"+req.body.id);
	var queryObj={};
	queryObj={
       id:req.body.id
	};
    var includeArr =[];
	service.findRow(modelName, queryObj, includeArr).then(function(response) {
    if (response) {
		return res.status(200).json({
			data: response
		});
		} else {
			return res.status(500).json({
				data: err
			});
		}
	});
}