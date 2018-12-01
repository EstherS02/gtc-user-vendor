'use strict';

const _ = require('lodash');
const moment = require('moment');
const sequelize = require('sequelize');
const service = require('../api/service');
const config = require('../config/environment');
const status = require('../config/status');
const model = require('../sqldb/model-connect');
const Handlebars = require('handlebars');
const sendEmail = require('./send-email');

module.exports = async function(job, done) {
	const code = job.attrs.data.code;
	const vendorFollowerModelName = "VendorFollower";
	const notificationSettingModelName = "NotificationSetting";
	const notificationModelName = "Notification";
	console.log("..................coupon notification............");
	try {
		// coupon code notification starts//
		if (code == config.notification.templates.couponCode) {
			const couponDetails = job.attrs.data.couponResponse;
			var couponCreatedArr = [];
			couponCreatedArr.push(couponDetails.created_by);
			var includeArr = [{
				model: model['User'],
				attributes: ['id', 'email', 'user_contact_email', 'email_verified', 'first_name'],
			}]
			var queryObjects = {
				vendor_id: couponDetails.vendor_id,
				status: status['ACTIVE']
			}
			var field = "id";
			var order = "ASC";
			var limit = null;
			service.findAllRows(vendorFollowerModelName, includeArr, queryObjects, 0, limit, field, order)
				.then(function(results) {
					if (results.count > 0) {
						var resultsArr = [];
						for (var i = 0; i < results.rows.length; i++) {
							resultsArr.push(results.rows[i]);
						}
						var queryObjNotification = {};
						queryObjNotification['code'] = config.notification.templates.couponCode;
						service.findOneRow(notificationSettingModelName, queryObjNotification)
							.then(function(response) {
								var bodyParamsArray = [];
								for (var j = 0; j < resultsArr.length; j++) {
									var bodyParams = {};
									bodyParams.user_id = resultsArr[j].User.id;
									bodyParams.description = response.description.replace('%couponcode%', couponDetails.code);
									bodyParams.name = response.name;
									bodyParams.code = response.code;
									bodyParams.is_read = 0;
									bodyParams.status = 1;
									bodyParams.created_on = new Date();
									bodyParams.created_by = "Administrator";
									bodyParamsArray.push(bodyParams);
								}
								var finalresults = bodyParamsArray.filter(o => Object.keys(o).length);
								service.createBulkRow(notificationModelName, finalresults);

							})
					}
					else {
						Console.log("<<<<<<<<<<<<<<<<<<<<NO FOLLOWERS OF THIS VENDOR>>>>>>>>>>>>>>>>>")
					}

				})
		}
		// coupon code notification ends//
		done();
	} catch (error) {
		done(error);
	}
};
