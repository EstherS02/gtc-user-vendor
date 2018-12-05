'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const RawQueries = require('../../raw-queries/sql-queries');
const Sequelize_Instance = require('../../sqldb/index');
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
export async function index(req, res) {
	var offset = req.query.offset ? parseInt(req.query.offset) : 0;
	var limit = req.query.limit ? parseInt(req.query.limit) : 10;
	var productAdsSettingTable = 'ProductAdsSetting';
	var queryObj = req.query;
	var queryObj1 ={};
	var queryObj2 =  {}
	var newArray = [];
	var results = {};
	var productQuery ={};


	var type = req.query.type ? parseInt(req.query.type) : 0;
	
	if (queryObj.fromDate && queryObj.toDate) {

		if (queryObj.columnName) {

			queryObj1[queryObj.columnName] = {

				'$gte': new Date(parseInt(queryObj.fromDate)),
				'$lte': new Date(parseInt(queryObj.toDate))
			}
			queryObj2[req.query.columnName]= queryObj1[req.query.columnName];
			delete queryObj.columnName;
		}
		delete queryObj.fromDate;
		delete queryObj.toDate;
	}
	if(queryObj.position){
		if(type == 1){
			if(queryObj.position != 7){
			queryObj1['position'] = queryObj.position;
			}
		}else if(type == 2){
			if(queryObj.position == 1){
				queryObj2['position_homepage'] = 1;			
			}else if(queryObj.position == 2){
				queryObj2['position_wholesale_landing'] = 1;			
			}else if(queryObj.position == 3){
				queryObj2['position_shop_landing'] = 1;			
			}else if(queryObj.position == 4){
				queryObj2['position_service_landing'] = 1;			
			}else if(queryObj.position == 5){
				queryObj2['position_subscription_landing'] = 1;			
			}else if(queryObj.position == 6){
				queryObj2['position_profilepage'] = 1;			
			}else{
				queryObj2['position_searchresult'] = 1;			
			}
		}
		else{
			if(queryObj.position == 1){
				queryObj2['position_homepage'] = 1;
			}else if(queryObj.position == 2){
				queryObj2['position_wholesale_landing'] = 1;			
			}else if(queryObj.position == 3){
				queryObj2['position_shop_landing'] = 1;			
			}else if(queryObj.position == 4){
				queryObj2['position_service_landing'] = 1;			
			}else if(queryObj.position == 5){
				queryObj2['position_subscription_landing'] = 1;			
			}else if(queryObj.position == 6){
				queryObj2['position_profilepage'] = 1;			
			}else{
				queryObj2['position_searchresult'] = 1;			
			}	

			if(queryObj.position != 7){
				queryObj1['position'] = queryObj.position;
			}else{
				queryObj1['position'] = 0;
			}
		}		
	}

	if(queryObj.last30days){
		var startDate = moment().add(-30,'days');
		var endDate = moment().format("YYYY-MM-DD");
		queryObj1['created_on'] = {
				'$gte':startDate,
				'$lte':endDate
			}
			queryObj2['created_on']= queryObj1['created_on'];
	}

	if(queryObj.text){
		queryObj1['name']={
			$like: '%'+ queryObj.text +'%'
		}
		productQuery['product_name'] = queryObj1['name'];
	}




	results.count = 0;
	results.total = 0;
	if (type == 0 || type == 1) {
		await model[productAdsSettingTable].findAndCountAll({
			where: queryObj1,
			include: [{
				model: model['Payment'],
				attributes: ['id', 'amount'],
				required: false
			}],
			attributes: ['id', ['name', 'product_name'], 'position', 'start_date', 'end_date', 'status', 'impression', 'clicks', 'created_by', 'created_on', 'last_updated_by', 'last_updated_on']
		}).then(function(response) {
			results.count = results.count + response.count;
			var arrayItem = JSON.parse(JSON.stringify(response.rows));

			_.forOwn(arrayItem, function(element) {
				element['type'] = 1;
				element['feature_indefinitely'] = null;
				newArray.push(element);
			});
		});
	}
	if (type == 0 || type == 2) {
		const featuredProductTable = 'FeaturedProduct';
		await model[featuredProductTable].findAndCountAll({
			where: queryObj2,
			include: [{
				model: model['Product'],
				where:productQuery,
				attributes: ['product_name']
			}, {
				model: model['Payment'],
				attributes: ['id', 'amount'],
				required: false
			}],
			attributes: ['id', 'position_homepage','feature_indefinitely', 'position_searchresult', 'position_profilepage', 'position_wholesale_landing', 'position_shop_landing', 'position_service_landing', 'position_subscription_landing', 'start_date', 'status', 'end_date', 'impression', 'clicks', 'created_by', 'created_on', 'last_updated_by', 'last_updated_on']
		}).then(function(response) {
			results.count = results.count + response.count;
			var arrayItem = JSON.parse(JSON.stringify(response.rows));
			_.forOwn(arrayItem, function(element) {
				element.type = 2;
				element.product_name = element.Product.product_name;
				newArray.push(element);
			});
		});
	}
	let arrayEle = _.orderBy(newArray, 'created_on', 'desc');
	arrayEle = arrayEle.slice(offset, offset + limit);
	var total_count = 0;
	for (var i = 0; i < arrayEle.length; i++) {
		if(arrayEle[i].Payment){
			if(arrayEle[i].Payment.amount != null)
			total_count = total_count + parseInt(arrayEle[i].Payment.amount);
		}
	}
	results.rows = arrayEle;
	results.total = total_count;
	return res.status(200).send(results);
}