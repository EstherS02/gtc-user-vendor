'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const async = require('async');
const path = require('path');
const vendorPlan = require('../../config/gtc-plan');
// var gtc = require('../../api/gtc/gtc.contoller')
var gtc = require('../../api/gtc/gtc.controller')


export async function createAd(req, res) {
	var queryObj = {};
	var bodyParam = JSON.parse(req.body.data);
	if(bodyParam.id){
		queryObj['id'] = bodyParam.id;
	}
	bodyParam['payment_id'] = 419;
	var modelName = "ProductAdsSetting";
	var uploadPath = '';
	const audit = req.user.first_name;
	bodyParam.vendor_id = req.user.Vendor.id;
	var productMediaUpload;
	if (req.files) {
		let file = req.files.file;
		const parsedFile = path.parse(file.originalFilename);
		const timeInMilliSeconds = new Date().getTime();
		uploadPath = config.images_base_path + parsedFile.name + "-" + timeInMilliSeconds + parsedFile.ext;
		productMediaUpload = await service.move(file.path, uploadPath);
		uploadPath = parsedFile.name + "-" + timeInMilliSeconds + parsedFile.ext;
	}
	if (productMediaUpload) {
		model[modelName].findOne({
			where: queryObj
		}).then((exists) => {
			if (exists) {
				let imgUrl = exists.image_url;
				bodyParam['image_url'] = uploadPath;
				bodyParam['last_updated_by'] = audit ? audit : 'Administrator';
				bodyParam['last_updated_on'] = new Date();
				const exist = exists.update(bodyParam);
				if (exist) {
					if (imgUrl) {
						service.imgDelete(imgUrl);
					}
					return res.status(200).send("Advertisement updated successfully");
				} else {
					return res.status(500).send("Internal serve error");
				}


			} else {
				bodyParam['created_by'] = audit ? audit : 'Administrator';
				bodyParam['created_on'] = new Date();
				model[modelName].create(bodyParam).then(function(response){
					return res.status(200).send("Advertisement added successfully");
				});
			}
		});
	} else {
		return res.status(500).send('Internal Serve Error')
	}
}
// /home/users/rsumithra/gtc-images/advertisementtrack-order-1542445500840.png