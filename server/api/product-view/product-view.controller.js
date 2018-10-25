'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
var async = require('async');
var pageScope;


export function addOrRemoveWishlist(req, res) {
	var LoggedInUser = {};

	if (req.user)
		LoggedInUser = req.user;

	var item = JSON.parse(req.body.data);
	var queryObj = item.queryObj;
	var data = item.newObj;
	var modelName = "WishList";
	var type = '';
	return model[modelName].findOne({
			where: queryObj
		})
		.then(function(foundItem) {

			if (!foundItem) {
				data.created_on = new Date();
				data.created_by = LoggedInUser.first_name;
				data.status = 1;
				// Item not found, create a new one
				return model[modelName].create(data)
					.then(function(response) {
						return res.status(200).status(200).json({
							type: "wish"
						});
					})
			}
			data.last_updated_on = new Date();
			data.last_updated_by = LoggedInUser.first_name;
			// Found an item, update it
			if (foundItem.status == 1) {
				data.status = 0;
				type = "unwish";
			} else {
				data.status = 1;
				type = "wish";
			}
			return model[modelName].update(data, {
					where: queryObj
				})
				.then(function(response) {
					return res.status(200).json({
						type: type
					});
				});
		});
}
export function vendorQuestion(req, res) {
	var LoggedInUser = {};

	if (req.user)
		LoggedInUser = req.user;
	req.checkBody('subject', 'Missing Subject Value').notEmpty();
	req.checkBody('message', 'Missing Message Value').notEmpty();
	var errors = req.validationErrors();
	var result = {};
	if (errors) {
		res.status(400).send("Please enter the value");
		return;
	}
	var vendorId = req.body.vendor_id;
	var includeArr = [{
		model: model['User'],
		attributes: {
			exclude: ['hashed_pwd', 'salt', 'email_verified_token', 'email_verified_token_generated', 'forgot_password_token', 'forgot_password_token_generated']
		}
	}];
	service.findIdRow('Vendor', vendorId, includeArr).then(function(result) {
		var queryObjNotification = {};
		var NotificationTemplateModel = 'NotificationSetting';
		queryObjNotification['code'] = config.notification.templates.productReview;
		service.findOneRow(NotificationTemplateModel, queryObjNotification)
			.then(function(response) {
				var bodyParams = {};
				bodyParams.user_id = result.User.id;
				bodyParams.description = '<div><strong>' + req.body.subject + '</strong></div><div>' + req.body.message + '</div>';
				bodyParams.name = response.name;
				bodyParams.code = response.code;
				bodyParams.is_read = 1;
				bodyParams.status = 1;
				bodyParams.created_on = new Date();
				service.createRow("Notification", bodyParams);
			});
		if (result.User.email_verified && req.user.email_verified) {
			var queryObjEmailTemplate = {};
			var emailTemplateModel = 'EmailTemplate';
			queryObjEmailTemplate['name'] = config.email.templates.askToVendor;
			var agenda = require('../../app').get('agenda');

			service.findOneRow(emailTemplateModel, queryObjEmailTemplate)
				.then(function(response) {
						var email = result.User.user_contact_email;
						var subject = response.subject.replace('%SUBJECT%', req.body.subject);
						var body;
						body = response.body.replace('%VENDOR_NAME%', req.body.vendor_name);
						body = body.replace('%USER_NAME%', LoggedInUser.first_name);
						body = body.replace('%MESSAGE%', req.body.message);
						var mailArray = [];
						mailArray.push({
							to: email,
							subject: subject,
							html: body
						});
						agenda.now(config.jobs.email, {
							mailArray: mailArray
						});
					return res.status(200).send("Your Question sent to this vendor");
				}).catch(function(error) {
					console.log('Error :::', error);
					return res.status(500).send("Internal Server Error");
				});
		} else {
			return res.status(500).send("Sorry you are unable to contact this vendor");
		}
	});
}

export function AddToCompare(req, res) {
	req.checkBody('product_id', 'Missing Product').notEmpty();
	var errors = req.validationErrors();
	var result = {};
	if (errors) {
		res.status(400).send(errors);
		return;
	}
	var compare = req.session['compare'] || [];
	if (compare.indexOf(req.body.product_id) == -1) {
		if (compare.length < 3) {
			compare.push(req.body.product_id);
		} else {
			compare.splice(0, 1);
			compare.push(req.body.product_id);
		}
		result = {
			message: "SUCCESS",
			message_details: "The One Product Added to your compare list",
		}
	} else {
		result = {
			message: "ERROR",
			message_details: "Product Already in your compare list",
		}
	}
	req.session['compare'] = compare;
	return res.status(200).json(result);
}

export function removeFromCompare(req, res) {

	req.checkBody('product_id', 'Missing Product Value').notEmpty();
	var errors = req.validationErrors();
	if (errors) {
		res.status(400).send(errors);
		return;
	}
	var compare = req.session['compare'] || [];
	var index = compare.indexOf(req.body.product_id);
	if (index > -1) {
		compare.splice(index, 1);
	}
	req.session['compare'] = compare;
	return res.status(200).json({
		message: "SUCCESS",
		message_details: "The One Product remove from your compare list",
	});
}