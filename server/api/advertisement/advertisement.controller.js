'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const RawQueries = require('../../raw-queries/sql-queries');
const Sequelize_Instance = require('../../sqldb/index');
const reportsService = require('../../api/reports/reports.service');
const service = require('../../api/service');
const async = require('async');
const path = require('path');
const moment = require('moment');
const sequelize = require('sequelize');
const _ = require('lodash');

const AdModel = 'ProductAdsSetting';

export async function createAd(req, res) {

	var bodyParam = {},
		adImageUpload;
	var uploadPath = '';
	var audit = req.user.first_name;

	if (_.isEmpty(req.files)) {
		return res.status(400).send({
			"message": "Error",
			"messageDetails": "Ad Image Required."
		});
	}

	req.checkBody('name', 'Missing Query Param').notEmpty();
	req.checkBody('position', 'Missing Query Param').notEmpty();
	req.checkBody('target_url', 'Missing Query Param').notEmpty();
	req.checkBody('start_date', 'Missing Query Param').notEmpty();
	req.checkBody('end_date', 'Missing Query Param').notEmpty();

	const startDate = new Date(req.body.start_date);
	const endDate = new Date(req.body.end_date);
	const currentDate = new Date();

	if (startDate <= currentDate) {
		return res.status(400).send({
			"message": "Error",
			"messageDetails": "Start date must be greater than current date."
		});
	} else if (endDate < startDate) {
		return res.status(400).send({
			"message": "Error",
			"messageDetails": "End date must be greater than start date."
		});
	} else {
		req.body.end_date = new Date(req.body.end_date);
		req.body.start_date = new Date(req.body.start_date);
	}

	var errors = req.validationErrors();
	if (errors) {
		return res.status(400).send({
			"message": "Error",
			"messageDetails": "Missing Query Params."
		});
	}

	bodyParam = req.body;
	bodyParam['payment_id'] = 419;
	bodyParam['status'] = statusCode.ACTIVE;
	bodyParam['created_by'] = audit ? audit : 'Administrator';
	bodyParam['created_on'] = new Date();

	if (req.user.Vendor.id)
		bodyParam.vendor_id = req.user.Vendor.id;

	var file = req.files.file;
	var parsedFile = path.parse(file.originalFilename);
	var timeInMilliSeconds = new Date().getTime();
	uploadPath = config.images_base_path + "/advertisment/" + parsedFile.name + "-" + timeInMilliSeconds + parsedFile.ext;
	adImageUpload = await service.move(file.path, uploadPath);

	if (adImageUpload) {
		bodyParam['image_url'] = config.imageUrlRewritePath.base + "advertisment/" + parsedFile.name + "-" + timeInMilliSeconds + parsedFile.ext;

		service.createRow(AdModel, bodyParam)
			.then(function(created) {
				return res.status(200).send({
					"message": "Success",
					"messageDetails": "Ad created successfully."
				});
			}).catch(function(error) {
				console.log("Error::", error);
				return res.status(500).send({
					"message": "Success",
					"messageDetails": "Internal Server Error."
				});
			})
	}
}

export async function editAd(req, res) {

	var bodyParam = {},
		adImageUpload;
	var uploadPath = '',
		imgUrl;
	var audit = req.user.first_name;

	req.checkBody('name', 'Missing Query Param').notEmpty();
	req.checkBody('position', 'Missing Query Param').notEmpty();
	req.checkBody('target_url', 'Missing Query Param').notEmpty();
	req.checkBody('start_date', 'Missing Query Param').notEmpty();
	req.checkBody('end_date', 'Missing Query Param').notEmpty();

	const startDate = new Date(req.body.start_date);
	const endDate = new Date(req.body.end_date);
	const currentDate = new Date();

	if (startDate <= currentDate) {
		return res.status(400).send({
			"message": "Error",
			"messageDetails": "Start date must be greater than current date."
		});
	} else if (endDate < startDate) {
		return res.status(400).send({
			"message": "Error",
			"messageDetails": "End date must be greater than start date."
		});
	} else {
		req.body.end_date = new Date(req.body.end_date);
		req.body.start_date = new Date(req.body.start_date);
	}

	var errors = req.validationErrors();
	if (errors) {
		return res.status(400).send({
			"message": "Error",
			"messageDetails": "Missing Query Params."
		});
	}

	bodyParam = req.body;
	bodyParam['payment_id'] = 419;
	bodyParam['last_updated_by'] = audit ? audit : 'Administrator';
	bodyParam['last_updated_on'] = new Date();

	if (req.user.Vendor.id)
		bodyParam.vendor_id = req.user.Vendor.id;

	if (req.files.file) {
		var file = req.files.file;
		var parsedFile = path.parse(file.originalFilename);
		var timeInMilliSeconds = new Date().getTime();
		uploadPath = config.images_base_path + "/advertisment/" + parsedFile.name + "-" + timeInMilliSeconds + parsedFile.ext;
		adImageUpload = await service.move(file.path, uploadPath);

		if (adImageUpload) {
			bodyParam['image_url'] = config.imageUrlRewritePath.base + "advertisment/" + parsedFile.name + "-" + timeInMilliSeconds + parsedFile.ext;
		}
	}

	try {
		const existingAd = await service.findIdRow(AdModel, req.params.id);
		if (existingAd) {
			const Ad = await service.updateRecordNew(AdModel, bodyParam, {
				id: req.params.id
			});
			return res.status(200).send({
				"message": "Success",
				"messageDetails": "Ad updated successfully."
			});
		} else {
			return res.status(400).send({
				"message": "Error",
				"messageDetails": "Ad not Found."
			});
		}
	} catch (error) {
		console.log("Error::", error);
		return res.status(500).send({
			"message": "Error",
			"messageDetails": "Internal Server Error."
		});
	}
}
// pls dont delete
// export function index(req,res){
// 		return new Promise((resolve, reject) => {
// 			Sequelize_Instance.query(RawQueries.adProducts(), {
// 				model: model['Product'],
// 				type: Sequelize_Instance.QueryTypes.SELECT
// 			}).then((results) => {
// 				var result = {};
// 				// resolve(results)
// 				result.count = results.lenght;
// 				result.rows = results;
// 				return res.status(200).send(result);

// 			}).catch(function(error) {
// 				return res.status(500).send(error);

// 			});
// 	// }
// 	});

// }
export function index(req, res) {
	reportsService.adFeaturedRevenue(req,res)
				.then((response) => {
					return res.status(200).send(response);
				})
				.catch((error) => {
					return res.status(500).send(error);
				});
}