'use strict';

const crypto = require('crypto');
const uuid = require('node-uuid');
const expressValidator = require('express-validator');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const status = require('../../config/status');
const service = require('../service');

export function remove(req, res) {
	const ids = req.body;
	const modelName = 'WishList';

	service.destroyManyRow(modelName, ids)
		.then(function(results) {
			console.log("WishList", results);
			if (results) {
				res.status(200).send(results);
				return;
			} else {
				res.status(404).send("Unable to delete");
				return;
			}
		}).catch(function(error) {
			console.log('Error:::', error);
			res.status(500).send("Internal server error");
			return;
		});

}

export function cart(req, res) {
	const data = req.body;
	data['user_id'] = 62;
	data['status'] = 1;
	data['created_by'] = 'devan vendor';
	data['created_on'] = new Date();
	// console.log(req.body.product_id);
	var queryObj = {
		user_id: 62,
		product_id: req.body.product_id
	}
	var modelName = 'Cart';
	var includeArr = '';  

	service.findOneRow(modelName, queryObj, includeArr)
		.then(function(results) {
			console.log("WishList", results.id);
			if (results) {
				var id = results.id;
				res.status(200).send(results);
				service.updateRow(modelName,data,id).then(function(response){
					// console.log("Update",response)
				});
				return;
			} else {
				// res.status(404).send("Unable to delete");
				service.createRow(modelName,data).then(function(response){
					// console.log("NEW:", response)
				});
				return;
			}
		}).catch(function(error) {
			console.log('Error:::', error);
			res.status(500).send("Internal server error");
			return;
		});
	// return model['Cart'].findOne({
	// 		where: queryObj
	// 	})
	// 	.then(function(obj) {
	// 		if (obj) { // update
	// 			// return obj.update(values);
	// 		} else { // insert
	// 			// return Model.create(values);
	// 			console.log("hai")
	// 		}
	// 	})
}