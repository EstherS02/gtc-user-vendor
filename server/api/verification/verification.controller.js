'use strict';

var async = require('async');
const mv = require('mv');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const uuid = require('node-uuid');
const expressValidator = require('express-validator');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const status = require('../../config/status');
const service = require('../service');
const roles = require('../../config/roles');
const verificationStatus = require('../../config/verification_status');

export function move(copyFrom, moveTo) {
	return new Promise((resolve, reject) => {
		mv(copyFrom, moveTo, {
			clobber: true,
			mkdirp: true
		}, function(error) {
			if (!error) {
				return resolve(true);
			} else {
				return reject(error);
			}
		});
	});
}
export function imgDelete(imgPath) {
	return new Promise((resolve, reject) => {
		  try{
		  	fs.unlinkSync(imgPath);
		  	resolve(true);
			}
			catch(err){
				return reject(error);
			}
		});
}

export async function storeData(req, res) {
	try {

		var bodyParam = {},
			vendorParam = {};
		var modelName = "VendorVerification";
		var data = JSON.parse(req.body.data);
		let vendor_id = req.user.Vendor.id;
		bodyParam.vendor_id = vendor_id;
		bodyParam.status = 1;
		bodyParam.created_by = req.user.first_name + ' ' + (req.user.last_name ? req.user.last_name : null);
		bodyParam.created_on = new Date();
		bodyParam.personal_id_verification_file_type = data.personal_id_verification_file_type;
		if(req.files){
			bodyParam.request_for_vendor_verification = 1;
			bodyParam.vendor_verified_status = verificationStatus['WAITING'];
		}else{
			res.status(500).send("Upload atleast One Image");
		}
		for (let key in req.files) {
			if (req.files.hasOwnProperty(key)) {
				const parsedFile = path.parse(req.files[key].originalFilename);
				const timeInMilliSeconds = new Date().getTime();
				const uploadPath = config.images_base_path + "/" + parsedFile.name + "-" + timeInMilliSeconds + parsedFile.ext;

				const productMediaUpload = await service.move(req.files[key].path, uploadPath);
				if (productMediaUpload) {
					bodyParam[key] = uploadPath;
					var status = key;
					status = status.replace('link', 'status');
					bodyParam[status] = verificationStatus['WAITING'];
				}
			}
		}
		const createRow = await service.createRow(modelName, bodyParam);
		if (createRow) {
			if (!createRow) {
				res.status(500).send("Internal server error");
			} else {
				
				res.status(200).send("Verification Request Sent");
			}
			return;
		}
	} catch (error) {
		console.log('Error:::', error);
		return res.status(500).send(error);
	}


}
export async function updateData(req, res) {
	var bodyParam = {},
		vendorParam = {};
	var modelName = "VendorVerification";
	let vendor_id = req.user.Vendor.id;
	var data = JSON.parse(req.body.data);
	if(req.files >0){
	bodyParam.request_for_vendor_verification = verificationStatus['WAITING'];
	bodyParam.vendor_verified_status = verificationStatus['WAITING'];
	}
	bodyParam.personal_id_verification_file_type = data.personal_id_verification_file_type;
	var includeArr = [];
	var deleteImg = {};
	var ID = req.params.id;
	try {
		const findData = await service.findIdRow(modelName, ID, includeArr);

		if (findData) {
			for (let key in req.files) {
				if (req.files.hasOwnProperty(key)) {
					const parsedFile = path.parse(req.files[key].originalFilename);
					const timeInMilliSeconds = new Date().getTime();
					const uploadPath = config.images_base_path + "/" + parsedFile.name + "-" + timeInMilliSeconds + parsedFile.ext;
					const productMediaUpload = await service.move(req.files[key].path, uploadPath);
					if (productMediaUpload) {
						bodyParam[key] = uploadPath;
						deleteImg[key] = findData[key];
						var status = key;
						status = status.replace('link', 'status');
						bodyParam[status] = verificationStatus['WAITING'];
					}
				}
			}
			bodyParam.last_updated_on = new Date();
			bodyParam.last_updated_by = req.user.first_name + ' ' + (req.user.last_name ? req.user.last_name : null);
			const updateData = await service.updateRow(modelName, bodyParam, req.params.id);
			if (!updateData) {

				res.status(500).send("Internal server error");
				return;
			} else {
				if(deleteImg){
					for(let key in deleteImg){
						const imgDeleteVar = await service.imgDelete(deleteImg[key]);
					}
				}
				res.status(200).send("Verification Request Sent");
				return;
			}
		} else {
			res.status(500).send("Internal server error");
			return;
		}
	} catch (error) {
		console.log('Error :::', error);
		return res.status(500).send("Internal server error");
	}
}