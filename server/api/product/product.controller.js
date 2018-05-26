'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');

export function vendorMarketplace(req, res) {

	model["VendorPlan"].find({
			where: req.query
		})
		.then(function(row) {
			if (row) {
				model["PlanMarketplace"].find({
						where: {
							plan_id: row.plan_id
						}
					})
					.then(function(row) {
						if (row) {

							res.status(200).send(row);
							return;
						} else {
							res.status(404).send("Not Found");
							return;
						}
					})
					.catch(function(error) {
						if (error) {
							res.status(500).send(error);
							return;
						}
					})
			} else {
				res.status(404).send("Not Found");
				return;
			}
		})
		.catch(function(error) {
			if (error) {
				res.status(500).send(error);
				return;
			}
		})
}

export function getMediaId(req, res) {


	var bodyParams = req.body;

	bodyParams["created_on"] = new Date();
	bodyParams["type"] = 1;
	bodyParams["status"] = 1;

	console.log("url.......", bodyParams);

	service.createRow('ProductMedia', bodyParams)
		.then(function(result) {
			if (result) {
				return res.status(201).send(result);
			} else {
				return res.status(404).send("Not found");
			}
		}).catch(function(error) {
			console.log('Error :::', error);
			res.status(500).send("Internal server error");
			return
		});
}

export function featureMany(req, res) {
	const ids = req.body.ids;
	console.log("requestedIds", ids.length);
	var arr = [];

	for (var i = 0; i <= ids.length - 1; i++) {
		var obj = {};
		obj['product_id'] = ids[i];
		obj['status'] = 1;
		obj['start_date'] = new Date();
		obj['created_on'] = new Date();
		arr.push(obj);
	}

	model["FeaturedProduct"].bulkCreate(arr, {
			ignoreDuplicates: true
		})
		.then(function(row) {
			res.status(201).send("Created");
			return;
		}).catch(function(error) {
			if (error) {
				res.status(500).send(error);
				return;
			}
		});
}

export function featureOne(req, res) {
	model["Product"].findById(req.params.id)
		.then(function(row) {
			if (row) {
				var obj = {};
				obj['product_id'] = row.id;
				obj['status'] = 1;
				obj['start_date'] = new Date();
				obj['created_on'] = new Date();

				model["FeaturedProduct"].upsert(obj)
					.then(function(row) {
						res.status(201).send("Created");
						return;
					})
					.catch(function(error) {
						if (error) {
							res.status(500).send(error);
							return;
						}
					});
			} else {
				res.status(404).send("Not found");
				return;
			}
		}).catch(function(error) {
			console.log('Error:::', error);
			res.status(500).send("Internal server error");
			return;
		})
}

export function vendorSalesCount(req, res){
       

	
}