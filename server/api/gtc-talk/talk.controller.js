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
	console.log(data);
	const modelName = 'BusinessHour';
	var includeArr = [];
	var queryObj = {
		vendor_id :29,
		from_day:req.body.from_day,
		to_day:req.body.to_day,
		// start_time:req.body.start_time,
		// end_time:req.body.end_time,
		timezone_id:req.body.timezone_id,
		status:1
	};

	service.findOneRow(modelName, queryObj, includeArr)
		.then(function(results) {
			console.log("talk", results);
			if (results) {
				var id = results.id;
				res.status(200).send(results);
				service.updateRow(modelName,data,id).then(function(response){
					console.log("Update",response)
				});
			} else {
				service.createRow(modelName,data).then(function(response){
			});
		}
	}).catch(function(error) {
			console.log('Error:::', error);
			res.status(500).send("Internal server error");
			return;
		});
}

export function storeData(req,res){
	const data = {}
	data.gtc_talk_enabled = req.body.gtc_talk_enabled;
	data.default_msg = req.body.default_msg;
	data.status = 1;
	
	data.vendor_id = 28;
	const modelName = 'TalkSetting';
	console.log(req.body);
	const includeArr = [];
	var queryObj = {
		vendor_id :28,
	};
	service.findOneRow(modelName, queryObj, includeArr)
		.then(function(results) {
			if (results) {
				var id = results.id;
				data.last_updated_on = new Date();
				res.status(200).send(results);
				service.updateRow(modelName,data,id).then(function(response){
					return;
				});
			} else {
				data.created_on = new Date();
				service.createRow(modelName,data).then(function(response){
					return;
			});
		}
	}).catch(function(error) {
			res.status(500).send("Internal server error",error);
			return;
		});
}