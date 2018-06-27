'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
var async = require('async');


export function addOrRemoveWishlist(req, res) {
	var LoggedInUser = {};

	if(req.user)
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

						console.log("create",response)
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
					console.log("create",response)
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
