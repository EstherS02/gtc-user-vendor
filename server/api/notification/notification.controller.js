'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
var async = require('async');

export function notificationSetting(req, res) {

	console.log("******************************************0")
	var data = JSON.parse(req.body.data);
	var i;
	var modelName = "VendorNotificationSetting";
	var queryObj = {};
	var includeArr = [];
	if (req.user.Vendor.id) {
		var vendor_id = req.user.Vendor.id;
		queryObj.vendor_id = vendor_id;
		data.forEach(function(element) {
			queryObj.notification_id = element;
			model[modelName].findOne({
				where: queryObj
			}).then(function(result) {
				var notification_id = element;
				if (result) {
					model[modelName].destroy({
						where: {
							vendor_id: vendor_id,
							notification_id: result.notification_id
						}
					}).then(function(response) {
						return;
					});

				} else {
					var bodyParam = {};
					bodyParam.vendor_id = vendor_id;
					bodyParam.notification_id = element;
					bodyParam.enabled = 0;
					bodyParam.status = 1;
					bodyParam.created_at = new Date();
					service.createRow(modelName, bodyParam).then(function(response) {
						return;
					});
					// console.log(i, "not in db")
				}
			});
		});
		return res.status(200).send("success");
	} else {
		return res.status(404).send("Invalid Entry");
	}
}