'use strict';

const crypto = require('crypto');
const uuid = require('node-uuid');
const expressValidator = require('express-validator');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const status = require('../../config/status');
const service = require('../service');
const roles = require('../../config/roles');

export function storeData(req, res) {
	var bodyParam = {};
	var modelName = "VendorVerification";
	if (req.body.personal_id_verification_file_link) {
		bodyParam.personal_id_verification_file_type = req.body.personal_id_verification_file_type;
		bodyParam.personal_id_verification_file_status = status['WAITING'];
		bodyParam.personal_id_verification_file_link = req.body.personal_id_verification_file_link;
	}
	if (req.body.personal_address_verification_file_link) {
		bodyParam.personal_address_verification_file_link = req.body.personal_address_verification_file_link;
		bodyParam.personal_address_verification_file_status = status['WAITING'];
	}
	if (req.body.business_verification_file_link) {
		bodyParam.business_verification_file_link = req.body.business_verification_file_link;
		bodyParam.business_verification_file_status = status['WAITING'];
	}
	if (req.body.business_address_verification_file_link) {
		bodyParam.business_address_verification_file_link = req.body.business_address_verification_file_link;
		bodyParam.business_address_verification_file_status = status['WAITING'];
	}

	bodyParam.request_for_vendor_verification = 1;
	bodyParam.vendor_verified_status = status['WAITING'];
	bodyParam.user_id = req.user.id;

	var queryObj = {
		user_id: req.user.id
	};
	var includeArr = [];

	service.findOneRow(modelName, queryObj, includeArr)
		.then(function (results) {
			console.log('new', results)
			if (results) {

				var id = results.id;
				bodyParam.last_updated_on = new Date();
				bodyParam.last_updated_by = req.user.first_name + ' ' + req.user.last_name;
				service.updateRow(modelName, bodyParam, id).then(function (response) {
					console.log("Update", response)
					return;
				});
			} else {
				bodyParam.status = 1;
				bodyParam.created_by = req.user.first_name + ' ' + req.user.last_name;
				bodyParam.uploaded_on = new Date();
				service.createRow(modelName, bodyParam).then(function (response) {
					console.log("News", response)
					return;
				});
			}
		});
}

export function addVendor(req, res) {


	console.log("======================", req.query)
	var bodyParams = {};
	var vendorBodyParams = {};
	model['User'].findOne({
		where: req.query
	}).then(function (user) {
		if (user) {
			bodyParams["status"] = status["ACTIVE"];
			bodyParams["role"] = roles["VENDOR"];
			bodyParams['last_updated_on'] = new Date();
			bodyParams['last_updated_by'] = req.user.first_name;

			model['User'].update(bodyParams, {
				where: req.query
			})
				.then(function (user) {
					if (user) {
						vendorBodyParams["status"] = status["ACTIVE"];
						bodyParams["user_id"] = req.query.user_id;
						bodyParams['last_updated_on'] = new Date();
						bodyParams['last_updated_by'] = req.user.first_name;

						model['Vendor'].create(vendorBodyParams)
							.then(function (vendor) {
								if (vendor) {
									res.status(201).send(rspUser);
									return;
								} else {
									res.status(404).send("Not found");
									return;
								}
							}).catch(function (error) {
								console.log('Error :::', error);
								res.status(500).send("Internal server error");
								return;
							})
					} else {
						res.status(404).send("Not found");
						return;
					}
				}).catch(function (error) {
					console.log('Error :::', error);
					res.status(500).send("Internal server error");
					return;
				})
		}
	})
		.catch(function (error) {
			console.log('Error :::', error);
			res.status(500).send("Internal server error");
			return;
		});

}

