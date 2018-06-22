'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
var async = require('async');

export function notifications(req, res) {
	var LoggedInUser = {};

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;

	//pagination 
	var page;
	var offset;
	var limit;
	var order = "asc";
	var field = "id";
	var modelName = 'Notification';
	var queryObj = {};
	var includeArr = [{
		model: model["VendorNotificationSetting"],
		where: {
			vendor_id: 29
		},
		required:false
	}];
	service.findRows(modelName, queryObj, 0, null, field, order, includeArr)
		.then(function(results) {
			// console.log(results.rows);
			res.render('notifications', {
				title: "Global Trade Connect",
				count: results.count,
				notification: results.rows,
				LoggedInUser:LoggedInUser
			}).catch(function(error) {
				console.log('Error :::', error);
				return callback(null);
			});
		});
}

function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}