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
	try {
		// coupon code notification starts//
		const couponDetails = job.attrs.data.couponResponse;
		var includeArr = [{
			model: model['User'],
			attributes: ['id', 'email', 'user_contact_email', 'email_verified', 'first_name'],
		},{
			model: model['Vendor'],
			attributes: ['id','vendor_name']
		}]
		var queryObject = {
			vendor_id: couponDetails.vendor_id,
			status: status['ACTIVE']
		}
		var field = "id";
		var order = "ASC";
		var limit = null;
		service.findAllRows(vendorFollowerModelName, includeArr, queryObject, 0, limit, field, order)
			.then(function(results) {
				if (results.count > 0) {
					var queryObjNotification = {};
					queryObjNotification['code'] = config.notification.templates.couponCode;
					service.findOneRow(notificationSettingModelName, queryObjNotification)
						.then(async function(response) {
							if (response) {
								var bodyParamsArray = [];
								for (let result of results.rows) {

									var couponType;
									if(couponDetails.discount_type == '1')
										couponType = '%';
									else
										couponType = '$'

									var bodyParams = {};
									bodyParams.user_id = result.User.id;
									bodyParams.description = response.description;
									bodyParams.description = bodyParams.description.replace('%USER_NAME%', result.User.first_name);
									bodyParams.description = bodyParams.description.replace('%VENDOR_NAME%', result.Vendor.vendor_name);
									bodyParams.description = bodyParams.description.replace('%AMOUNT%', couponDetails.discount_value);
									bodyParams.description = bodyParams.description.replace('%TYPE%', couponType);
									bodyParams.description = bodyParams.description.replace('%COUPON_NAME%', couponDetails.coupon_name);
									bodyParams.description = bodyParams.description.replace('%COUPON_CODE%', couponDetails.code);
									bodyParams.description = bodyParams.description.replace('%EXPIRY_DATE%', couponDetails.expiry_date);
									bodyParams.description = bodyParams.description.replace('%PATH%', '/gtc-mail/compose?id='+result.vendor_id+'&text='+result.Vendor.vendor_name);
									bodyParams.name = response.name;
									bodyParams.code = response.code;
									bodyParams.is_read = 0;
									bodyParams.status = 1;
									bodyParams.created_on = new Date();
									bodyParams.created_by = "Administrator";
									bodyParamsArray.push(bodyParams);
								}
								var finalresults = bodyParamsArray.filter(o => Object.keys(o).length);
								await service.createBulkRow(notificationModelName, finalresults);
							}
							done();
						})
				}
				else {
					done();
				}
			})
	} catch (error) {
		return error;
	}
};
