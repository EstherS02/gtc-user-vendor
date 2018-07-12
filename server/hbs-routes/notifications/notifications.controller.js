'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
var async = require('async');
const vendorPlan = require('../../config/gtc-plan');

export function notifications(req, res) {
	var LoggedInUser = {};

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;
	if(req.user.Vendor.id){
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
			vendor_id: req.user.Vendor.id
		},
		required:false
	}];
	service.findRows(modelName, queryObj, 0, null, field, order, includeArr)
		.then(function(results) {
			res.render('notifications', {
				title: "Global Trade Connect",
				count: results.count,
				notification: results.rows,
				LoggedInUser:LoggedInUser,
				vendorPlan:vendorPlan
			}).catch(function(error) {
				console.log('Error:::', error);
            	res.render('notifications', error);
			});
		});
	}else {
		res.render('homePage');
	}
}

function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}