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
	const couponModelName = "Coupon";
	const vendorFollowerModelName = "VendorFollower";
	const notificationSettingModelName = "NotificationSetting";
	const notificationModelName = "Notification";
	console.log("..................coupon notification............");
	try {
		// coupon code notification starts//
		if (code == config.notification.templates.couponCode) {
			//vendor follower created user Id
			const couponuserId = job.attrs.data.couponuserId;
			const couponID = job.attrs.data.couponId;
			var includeArr = [];
			var queryObj = {
				id: couponID
			}
			var field = "id";
			var order = "desc";
			var limit = 1;
			service.findAllRows(couponModelName, includeArr, queryObj, 0, limit, field, order).
				then(function(CouponDetails) {
					var coupondetails = [];
					var productscoupons = CouponDetails.rows[0].code;
					coupondetails.push(productscoupons);
					var includeArr = [{
						model: model['Vendor'],
						attributes: ['id', 'vendor_name'],
						include: [{
							model: model['User'],
							attributes: ['id', 'email', 'user_contact_email', 'email_verified', 'first_name'],
						}]

					}]
					var queryObj = {
						user_id: couponuserId,
						status: status['ACTIVE']
					}
					var field = "id";
					var order = "ASC";
					var limit = null;
					service.findAllRows(vendorFollowerModelName, includeArr, queryObj, 0, limit, field, order)
						.then(function(results) {
							var resultsarr = [];
							for (var i = 0; i < results.rows.length; i++) {
								resultsarr.push(results.rows[i]);
							}
							var queryObjNotification = {};
							queryObjNotification['code'] = config.notification.templates.couponCode;
							service.findOneRow(notificationSettingModelName, queryObjNotification)
								.then(function(response) {
									var bodyParamsArray = [];
									for (var j = 0; j < resultsarr.length; j++) {
										var Coupondetails = coupondetails;
										var bodyParams = {};
										bodyParams.user_id = resultsarr[j].Vendor.User.id;
										bodyParams.description = response.description.replace('%couponcode%', Coupondetails);
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
						})

				})
		}
		// coupon code notification ends// 
		done();
	} catch (error) {
		done(error);
	}
};