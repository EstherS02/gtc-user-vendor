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
					var queryObjEmailTemplate = {};
					queryObjEmailTemplate['name'] = config.email.templates.vendorCoupon;
					service.findOneRow(emailTemplateModel, queryObjEmailTemplate)
						.then(function(response) {
							for (var i = 0; i < resultsArr.length; i++) {
								var agenda = require('../app').get('agenda');
								var email = resultsArr[i].User.user_contact_email;
								var subject = response.subject;
								var body;
								var body = response.body;
								body = body.replace('%first_name%', resultsArr[i].User.first_name);
								body = body.replace('%couponCode%', couponDetails.code);
								body = body.replace('%createdby%', couponDetails.created_by);
								var mailArray = [];
								mailArray.push({
									to: email,
									subject: subject,
									html: body
								});
								agenda.now(config.jobs.email, {
									mailArray: mailArray
								});
							}
						})
				}
				else {
					console.log("<<<<<<<<<<<<<<<<<<NO ONE FOLLOWERS THIS VENDOR>>>>>>>>");
				}
			})
		done();
	} catch (error) {
		done(error);
	}

}