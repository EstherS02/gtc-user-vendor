'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const async = require('async');
const vendorPlan = require('../../config/gtc-plan');
const Position = require('../../config/position');
// var gtc = require('../../api/gtc/gtc.contoller')
var gtc = require('../../api/gtc/gtc.controller')


export function storeForm(req,res){
	var bodyParam= req.body;
	var modelName = "ProductAdsSetting";

	bodyParam.vendor_id = req.user.Vendor.id;
	if(req.param.id){
		bodyParam.last_updated_on = new Date();
	}else{
		bodyParam.created_on = new Date();
	}
	if(req.body.id){
		service.updateRow(modelName,bodyParam,req.body.id).then(function(response){

			res.status(200).send("Advertisement updated successfully");
		});
	}else{

		service.createRow(modelName,bodyParam).then(function(response){
			res.status(200).send("Advertisement added successfully");
		});
	}


}