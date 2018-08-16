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
	var type = '';
	return model[modelName].findOne({
			where: queryObj
		})
		.then(function(foundItem) {
			
			if (!foundItem) {
				data.created_on = new Date();
				data.created_by = LoggedInUser.first_name;
				data.status = 1;
				// Item not found, create a new one
				return model[modelName].create(data)
					.then(function(response) {

						console.log("create", response)
						return res.status(200).status(200).json({
							type: "wish"
						});
					})
			}
			data.last_updated_on = new Date();
			data.last_updated_by = LoggedInUser.first_name;
			// Found an item, update it
			if(foundItem.status == 1){
				data.status = 0;
				type = "unwish"; 
			}else{
				data.status = 1;
				type = "wish";
			}
			return model[modelName].update(data, {
					where: queryObj
				})
				.then(function(response) {
					return res.status(200).json({
							type: type
						});
				});
		});
}
export function vendorFollow(req, res) {


}

export function AddToCompare(req, res) {
	req.checkBody('product_id', 'Missing Product').notEmpty();
	var errors = req.validationErrors();
	var result = {};
	if (errors) {
		res.status(400).send(errors);
		return;
	}
	var compare = req.session['compare'] || []; 
	if(compare.indexOf(req.body.product_id) == -1) {
	if (compare.length < 3) {
		compare.push(req.body.product_id);
	} else {
		compare.splice(0,1);
		compare.push(req.body.product_id);
	}
	result ={
			message : "SUCCESS",
			message_details : "The One Product Added to your compare list",
		}
	}
	else{
		result ={
			message : "ERROR",
			message_details : "Product Already in your compare list",
		}
	}
	req.session['compare'] = compare;
	console.log("req.session.compare", req.session['compare']);
	return res.status(200).json(result);
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
	return res.status(200).json({
						message : "SUCCESS",
						message_details : "The One Product remove from your compare list",
					});
}