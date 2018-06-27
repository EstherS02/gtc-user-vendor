'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
var async = require('async');

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
		.then(function (row) {
			res.status(201).send("Created");
			return;
		}).catch(function (error) {
			if (error) {
				res.status(500).send(error);
				return;
			}
		});
}

export function featureOne(req, res) {
	model["Product"].findById(req.params.id)
		.then(function (row) {
			if (row) {
				var obj = {};
				obj['product_id'] = row.id;
				obj['status'] = 1;
				obj['start_date'] = new Date();
				obj['created_on'] = new Date();
				model["FeaturedProduct"].upsert(obj)
					.then(function (row) {
						res.status(201).send("Created");
						return;
					})
					.catch(function (error) {
						if (error) {
							res.status(500).send(error);
							return;
						}
					});
			} else {
				res.status(404).send("Not found");
				return;
			}
		}).catch(function (error) {
			console.log('Error:::', error);
			res.status(500).send("Internal server error");
			return;
		})
}

export function addProduct(req, res) {

	req.query.vendor_id = 36;
	req.query.status = 1;
	req.query.publish_date = '2018-06-04';

	model["Product"].create(req.query)
		.then(function (row) {
			req.body.product_id=row.id;
			if(req.body.url) {
				model["ProductMedia"].create(req.body)				
					.then(function (row) {
						console.log('Created:::', row);
						res.status(200).send("Created");
						return;
					}).catch(function (error) {
						console.log('Error:::', error);
						res.status(500).send("Internal server error");
						return;
					});
			} else {
				console.log("no image sucess")
				res.status(200).send("Created");
				return;
			}
		}).catch(function (error) {
			console.log('Error:::', error);
			res.status(500).send("Internal server error");
			return;
		})
}


		

