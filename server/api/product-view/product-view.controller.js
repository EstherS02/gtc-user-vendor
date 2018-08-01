'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
var async = require('async');
var pageScope;


export function addOrRemoveWishlist(req, res) {
	var LoggedInUser = {};

	if (req.user)
		LoggedInUser = req.user;

	var item = JSON.parse(req.body.data);
	var queryObj = item.queryObj;
	var data = item.newObj;
	var modelName = "WishList";

	return model[modelName].findOne({
			where: queryObj
		})
		.then(function(foundItem) {
			console.log(foundItem);
			if (!foundItem) {
				data.created_on = new Date();
				data.created_by = LoggedInUser.first_name;
				// Item not found, create a new one
				return model[modelName].create(data)
					.then(function(response) {

						console.log("create", response)
						return res.status(200).send(response);
						//  {
						// 	response: response,
						// 	created: true
						// };
					})
			}
			data.last_updated_on = new Date();
			data.last_updated_by = LoggedInUser.first_name;
			// Found an item, update it
			return model[modelName].update(data, {
					where: queryObj
				})
				.then(function(response) {
					console.log("create", response)
					return res.status(200).send(response);
					// {
					// 	response: response,
					// 	created: false
					// }
				});
		});
}
export function vendorFollow(req, res) {


}

export function AddToCompare(req, res) {
	req.checkBody('product_id', 'Missing Product').notEmpty();
	var errors = req.validationErrors();
	if (errors) {
		res.status(400).send(errors);
		return;
	}
	var compare = req.session['compare'] || [];  
	if (compare.length < 3) {
		compare.push(req.body.product_id);
	} else {
		compare.splice(0,1);
		compare.push(req.body.product_id);
	}
	req.session['compare'] = compare;
	console.log("req.session.compare", req.session['compare']);
	return res.status(200).send('OK');
} 

export function removeFromCompare(req,res) {
	
	req.checkBody('product_id', 'Missing Product Value').notEmpty();
	var errors = req.validationErrors();
	if (errors) {
		res.status(400).send(errors);
		return;
	}
	var compare = req.session['compare'] || [];  
	var index = compare.indexOf(req.body.product_id);
	if (index > -1) {
	  compare.splice(index, 1);
	}
	req.session['compare'] = compare;
	console.log("req.session.compare", req.session['compare']);
	return res.status(200).send('OK');
}