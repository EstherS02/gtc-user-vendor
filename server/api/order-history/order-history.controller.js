'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
const statusCode = require('../../config/status');

var async = require('async');


export function updateStatus(req, res) {
	// console.log(req.body);
	var id = JSON.parse(req.body.id);
	var status =  req.body.status;
	var modelName = "OrderItem";
	var bodyParams={};
	console.log(id);
	bodyParams.status = statusCode["INACTIVE"];
	service.updateRow(modelName, bodyParams, id).then(function(response){
		// console.log("response",response);
		if(response)
		res.status(201).send("Created");
			return;
	});

	


}
// export function addCountry(req, res) {

	
// }
// export function removeCountry(req, res) {

	
// }