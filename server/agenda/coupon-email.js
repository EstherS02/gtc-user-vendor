'use strict';

const _ = require('lodash');
const moment = require('moment');
const sequelize = require('sequelize');
const Handlebars = require('handlebars');
const sendEmail = require('./send-email');
const service = require('../api/service');
const config = require('../config/environment');
const status = require('../config/status');
const model = require('../sqldb/model-connect');

module.exports = async function(job, done) {
	try {
		const vendorFollowerModelName = "VendorFollower";
		const emailTemplateModel = 'EmailTemplate';
		const couponDetails = job.attrs.data.couponResponse;
		var includeArr = [{
			model: model['User'],
			attributes: ['id', 'email', 'user_contact_email', 'email_verified', 'first_name'],
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
					var queryObjEmailTemplate = {};
					queryObjEmailTemplate['name'] = config.email.templates.vendorCoupon;
					service.findOneRow(emailTemplateModel, queryObjEmailTemplate)
						.then(async function(response) {
							if (response) {
								for (let result of results.rows) {
									if (result.User.user_contact_email && result.User.email_verified) {
										var email = result.User.user_contact_email;
										var subject = response.subject;
										var body;
										var body = response.body;
										body = body.replace('%first_name%', result.User.first_name);
										body = body.replace('%couponCode%', couponDetails.code);
										body = body.replace('%createdby%', couponDetails.created_by);
										await sendEmail({
											to: email,
											subject: subject,
											html: body
										});
									}
								}
							}
							done();
						});
				} else {
					done();
				}
			});
	} catch (error) {
		return error;
	}
}