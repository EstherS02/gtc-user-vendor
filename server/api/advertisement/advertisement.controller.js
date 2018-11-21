'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const async = require('async');
const path = require('path');
const _ = require('lodash');

export async function createAd(req, res) {

	var queryObj = {}, bodyParam={}, productMediaUpload;
	var modelName = "ProductAdsSetting";
	var uploadPath = '';
	var audit = req.user.first_name;

	if (_.isEmpty(req.files)) {
		return res.status(400).send("Ad image required.");
	}

	req.checkBody('name', 'Missing Query Param').notEmpty();
	req.checkBody('position', 'Missing Query Param').notEmpty();
	req.checkBody('target_url', 'Missing Query Param').notEmpty();
	req.checkBody('start_date', 'Missing Query Param').notEmpty();
	req.checkBody('end_date', 'Missing Query Param').notEmpty();

	const startDate = new Date(req.body.start_date);
	const endDate = new Date(req.body.end_date);
	const currentDate = new Date();

	if (startDate >= currentDate && endDate > startDate) {
		req.body.end_date = new Date(req.body.end_date);
		req.body.start_date = new Date(req.body.start_date);
	} else {
		return res.status(400).send({
			"message": "Error",
			"messageDetails": "Invalid Start date and End date."
		});
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
	bodyParam['status'] = 1;

	if(req.user.Vendor.id)
		bodyParam.vendor_id = req.user.Vendor.id;

	queryObj.id = req.params.id? req.params.id: 'undefined';

	if (req.files) {
		var file = req.files.file;
		var parsedFile = path.parse(file.originalFilename);
		var timeInMilliSeconds = new Date().getTime();
		uploadPath = config.images_base_path + parsedFile.name + "-" + timeInMilliSeconds + parsedFile.ext;
		productMediaUpload = await service.move(file.path, uploadPath);
		uploadPath = parsedFile.name + "-" + timeInMilliSeconds + parsedFile.ext;
	}
	if (productMediaUpload) {
		model[modelName].findOne({
			where: queryObj
		}).then((exists) => {
			bodyParam['image_url'] = uploadPath;
			if (exists) {
				let imgUrl = exists.image_url;
				bodyParam['last_updated_by'] = audit ? audit : 'Administrator';
				bodyParam['last_updated_on'] = new Date();
				const exist = exists.update(bodyParam);
				if (exist) {
					if (imgUrl) {
						service.imgDelete(imgUrl);
					}
					return res.status(200).send({
						"message": "Success",
						"messageDetails": "Ad Updated Successfully"
					});
				} else {
					return res.status(500).send({
						"message": "Error",
						"messageDetails": "Internal Server Error"
					});
				}
			} else {
				bodyParam['created_by'] = audit ? audit : 'Administrator';
				bodyParam['created_on'] = new Date();
				service.createRow(modelName,bodyParam)
				.then(function(created){
					return res.status(200).send({
						"message": "Success",
						"messageDetails": "Ad created successfully."
					});
				}).catch(function(error){
					console.log("Error::",error)
					return res.status(500).send({
						"message": "Success",
						"messageDetails": "Internal Server Error."
					});
				})
			}
		}).catch(function(error){
			return res.status(500).send({
				"message": "Error",
				"messageDetails": error
			});
		})
	} else {
		return res.status(500).send({
			"message": "Error",
			"messageDetails": "Internal Server Error"
		});
	}
}