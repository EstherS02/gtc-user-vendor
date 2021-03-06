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
	data['vendor_id'] = req.user.Vendor.id;
	data['status'] = 1;
	const modelName = 'BusinessHour';
	var includeArr = [];
	var queryObj = {
		vendor_id :req.user.Vendor.id,
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
					res.status(200).send(response);
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
	data.talk_profile_pic_url = req.body.talk_profile_pic_url;
	data.status = 1;
	data.vendor_id = req.user.Vendor.id;
	console.log(req.user);
	const modelName = 'TalkSetting';
	console.log( 'data',req.data);
	const includeArr = [];
	var queryObj = {
		vendor_id :req.user.Vendor.id,
	};

	service.findOneRow(modelName, queryObj, includeArr)
		.then(function(results) {
			if (results) {
				var id = results.id;
				data.last_updated_on = new Date();
				service.updateRow(modelName,data,id).then(function(err,response){
				res.status(200).send(response);
					return;
				});
			} else {
				data.created_on = new Date();
				service.createRow(modelName,data).then(function(response){
					res.status(200).send(response);
					return;
			});
		}
	}).catch(function(error) {
			res.status(500).send("Internal server error",error);
			return;
		});
}