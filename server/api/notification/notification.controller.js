'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
var async = require('async');

export function notificationSetting(req, res) {

	var data = JSON.parse(req.body.data);
	var i;
	var modelName = "VendorNotificationSetting";
	var queryObj = {};
	var includeArr = [];
	if (req.user.Vendor.id) {
		var vendor_id = req.user.Vendor.id;
		queryObj.vendor_id = vendor_id;
		data.forEach(function(element) {
			queryObj.vendor_notification_id = element;
			model[modelName].findOne({
				where: queryObj
			}).then(function(result) {
				var vendor_notification_id = element;
				if (result) {
					model[modelName].destroy({
						where: {
							vendor_id: vendor_id,
							vendor_notification_id: result.vendor_notification_id
						}
					}).then(function(response) {
						return;
					});

				} else {
					var bodyParam = {};
					bodyParam.vendor_id = vendor_id;
					bodyParam.vendor_notification_id = element;
					bodyParam.enabled = 0;
					bodyParam.status = 1;
					bodyParam.created_at = new Date();
					service.createRow(modelName, bodyParam).then(function(response) {
						return;
					});
				}
			});
		});
		return res.status(200).send("success");
	} else {
		return res.status(404).send("Invalid Entry");
	}
}
export function readNotification(req, res) {
	var id = req.params.id;
	var modelName = "Notification";
	var bodyParams = {
		is_read: 0
	};
	service.updateRow(modelName, bodyParams, id).then(function(response) {
		return res.status(200).send("success");
	})
}

export function NotificationCount(req, res) {
	var modelName = "Notification";
	var queryObj = {
		user_id: req.user.id,
		is_read: 1
	};
	service.countRows(modelName, queryObj).then(function(NotificationCount) {
		NotificationCount = {
			NotificationCount: NotificationCount
		}
		res.status(200).send(NotificationCount);
		return;
	}).catch(function(error) {
		res.status(500).send("Internal server error");
		return;
	});
}

export function deleteNotification(req, res){
	var id = req.params.id;
	var modelName = "Notification";
	var bodyParams = {
		is_read: 0,
		deleted_at: new Date()
	};
	service.updateRow(modelName, bodyParams, id).then(function(response) {
		return res.status(200).send("success");
	})
}