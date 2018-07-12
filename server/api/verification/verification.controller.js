'use strict';

var async = require('async');
const crypto = require('crypto');
const uuid = require('node-uuid');
const expressValidator = require('express-validator');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const status = require('../../config/status');
const service = require('../service');
const roles = require('../../config/roles');
const verificationStatus = require('../../config/verification_status');

export function storeData(req, res) {
	var bodyParam = {}, vendorParam = {};
	var modelName = "VendorVerification";

	let vendor_id= req.user.Vendor.id;

	if (req.body.personal_id_verification_file_link) {
		bodyParam.personal_id_verification_file_type = req.body.personal_id_verification_file_type;
		bodyParam.personal_id_verification_file_status = verificationStatus['WAITING'];
		bodyParam.personal_id_verification_file_link = req.body.personal_id_verification_file_link;
	}
	if (req.body.personal_address_verification_file_link) {
		bodyParam.personal_address_verification_file_link = req.body.personal_address_verification_file_link;
		bodyParam.personal_address_verification_file_status = verificationStatus['WAITING'];
	}
	if (req.body.business_verification_file_link) {
		bodyParam.business_verification_file_link = req.body.business_verification_file_link;
		bodyParam.business_verification_file_status = verificationStatus['WAITING'];
	}
	if (req.body.business_address_verification_file_link) {
		bodyParam.business_address_verification_file_link = req.body.business_address_verification_file_link;
		bodyParam.business_address_verification_file_status = verificationStatus['WAITING'];
	}

	bodyParam.request_for_vendor_verification = 1;
	bodyParam.vendor_verified_status = verificationStatus['WAITING'];
	bodyParam.vendor_id = req.vendor_id;


	var queryObj = {
		vendor_id: vendor_id
	};
	var includeArr = [];

	async.series({
		verification: function (callback) {
			service.findOneRow(modelName, queryObj, includeArr)
				.then(function (results) {

					if (results) {
						var id = results.id;
						bodyParam.last_updated_on = new Date();
						bodyParam.last_updated_by = req.user.first_name + ' ' + req.user.last_name;
						service.updateRow(modelName, bodyParam, id).then(function (response) {
							return callback(null, response);
						});
					} else {
						bodyParam.status = 1;
						bodyParam.created_by = req.user.first_name + ' ' + req.user.last_name;
						bodyParam.uploaded_on = new Date();
						service.createRow(modelName, bodyParam).then(function (response) {
							//console.log("News", response)
							return callback(null, response);
						});
					}

				}).catch(function (error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},	
	}, function (err, results) {
		if (!err) {
			res.status(200).send("Verification Request Sent");
			return;
		} else {
			res.status(500).send("Internal server error");
			return;
		}
	});
}
/*
export function addVendor(req, res) {

	var bodyParams = {};
	var vendorBodyParams = {};
	model['User'].findOne({
		where: {
			id: req.query.user_id
		}
	}).then(function (user) {
		if (user) {
			bodyParams["status"] = status["ACTIVE"];
			bodyParams["role"] = roles["VENDOR"];
			bodyParams['last_updated_on'] = new Date();
			bodyParams['last_updated_by'] = req.user.first_name;

			model['User'].update(bodyParams, {
				where: {
					id: req.query.user_id
				}
			}).then(function (user) {
				if (user) {
					vendorBodyParams["status"] = status["ACTIVE"];
					vendorBodyParams["user_id"] = req.query.user_id;
					vendorBodyParams["vendor_name"] = req.query.vendor_name;
					vendorBodyParams['last_updated_on'] = new Date();
					vendorBodyParams['last_updated_by'] = req.user.first_name;

					model['Vendor'].create(vendorBodyParams)
						.then(function (vendor) {
							if (vendor) {
								res.status(201).send(vendor);
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
	}).catch(function (error) {
		console.log('Error :::', error);
		res.status(500).send("Internal server error");
		return;
	});
}
*/
