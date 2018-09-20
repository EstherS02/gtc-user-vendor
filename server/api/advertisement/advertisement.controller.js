'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const async = require('async');
const vendorPlan = require('../../config/gtc-plan');
const Position = require('../../config/position');

export function storeForm(req,res){
	console.log(JSON.stringify(req.body.data));
	res.status(200).send("success")
}