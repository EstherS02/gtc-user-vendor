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
	data['user_id'] = req.user.id;
	data['status'] = status['ACTIVE'];
	data['created_by'] = 'devan vendor';
	data['created_on'] = new Date();
	var queryObj = {
		user_id: req.user.id,
		product_id: req.body.product_id
	}
	var modelName = 'Cart';
	var includeArr = '';  

	service.findOneRow(modelName, queryObj, includeArr)
		.then(function(results) {
			if (results) {
				var id = results.id;
				service.updateRow(modelName,data,id).then(function(response){
					// console.log("Update",response)
					res.status(200).send(results);
				});
				return;
			} else {
				service.createRow(modelName,data).then(function(response){
					// console.log("NEW:", response)
					res.status(200).send(results);
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

export function deleteAll(req, res){
var user_id = req.user.id;
	var modelName = "WishList";

	model[modelName].update({
		status: status["DELETED"]
	}, {
		where: {
			user_id: user_id
		}
	}).then(function(rows) {
			res.status(200).send(rows);

		}).catch(function(error) {
			res.status(500).send("Internal server error");
		});

}