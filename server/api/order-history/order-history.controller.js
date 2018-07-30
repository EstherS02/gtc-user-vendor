'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
const statusCode = require('../../config/status');
const orderStaus = require('../../config/order_status');
const sendEmail = require('../../agenda/send-email');
var async = require('async');
const populate = require('../../utilities/populate')

export function updateStatus(req, res) {
	var paramsID = req.params.id;
	var bodyParams = req.body;
	var order_status, purchase_order_id, user_email;
	var includeArr = ['User'];

	if (bodyParams.order_status == orderStaus.CONFIRMEDORDER) {
		order_status = 'confirmed';
	}

	if (bodyParams.order_status == orderStaus.PROCESSINGORDER) {
		order_status = 'processed';
	}

	if (bodyParams.order_status == orderStaus.DISPATCHEDORDER) {
		order_status = 'dispatched';
	}

	if (bodyParams.order_status == orderStaus.DELIVEREDORDER) {
		order_status = 'delivered';
	}

	if (bodyParams.order_status == orderStaus.RETURNEDORDER) {
		order_status = 'returned';
	}

	if (bodyParams.order_status == orderStaus.CANCELLEDORDER) {
		order_status = 'cancelled';
	}

	if (bodyParams.order_status == orderStaus.FAILEDORDER) {
		order_status = 'failed';
	}

	bodyParams["last_updated_on"] = new Date();

	service.findIdRow("Order", paramsID, includeArr)
		.then(function (row) {
			if (row) {
				console.log(row);
				delete bodyParams["id"];

				service.updateRow("Order", bodyParams, paramsID)
					.then(function (result) {
						if (result) {

							purchase_order_id = row.purchase_order_id;
							user_email = row.User.email;

							var queryObjEmailTemplate = {};
							var emailTemplateModel = "EmailTemplate";
							queryObjEmailTemplate['name'] = config.email.templates.orderMail;

							service.findOneRow(emailTemplateModel, queryObjEmailTemplate)
								.then(function (response) {
									if (response) {
										var email = user_email;
										var subject = response.subject.replace('%ORDER_TYPE%', 'Order Status');
										var body;

										body = response.body.replace('%ORDER_MSG%', order_status);
										body = body.replace('%ORDER_TYPE%', 'Order Status');
										body = body.replace('%ORDER_NUMBER%', purchase_order_id);
										//body = body.replace('%LINK%', config.baseUrl + '/user-verify?email=' + email + "&email_verified_token=" + email_verified_token);

										sendEmail({
											to: email,
											subject: subject,
											html: body
										});
										return res.status(201).send(result);
									} else {
										return res.status(201).send(result);
									}
								}).catch(function (error) {
									console.log('Error :::', error);
									res.status(500).send("Internal server error");
									return;
								});
						} else {
							return res.status(404).send("Unable to update");
						}
					}).catch(function (error) {
						console.log('Error :::', error);
						res.status(500).send("Internal server error");
						return
					})
			}
		}).catch(function (error) {
			console.log('Error :::', error);
			res.status(500).send("Internal server error");
			return
		});
}

export function vendorCancel(req, res) {

	var item_name,vendor_name,reason_for_cancellation;

	var paramsID = req.params.id;
	var bodyParams = req.body;
	var includeArr = populate.populateData("User,OrderItem,OrderItem.Product");

	service.findIdRow("Order", paramsID, includeArr)
		.then(function (row) {
			
			var purchase_order_id = row.purchase_order_id;
			var orderItems = row.OrderItems;

			orderItems.forEach(function (element) {

				if (element.id == bodyParams.item_id) {
					item_name = element.Product.product_name;
					vendor_name = element.Product.Vendor.vendor_name;
					user_email = row.User.email;

					var queryObjEmailTemplate = {};
					var emailTemplateModel = "EmailTemplate";
					queryObjEmailTemplate['name'] = config.email.templates.itemCancel;

					service.findOneRow(emailTemplateModel, queryObjEmailTemplate)
						.then(function (response) {
							if (response) {
								var email = user_email;
								reason_for_cancellation= bodyParams.reason_for_cancellation;
								var subject = response.subject.replace('%ORDER_TYPE%', 'Order Status');
								var body;

								body = response.body.replace('%ORDER_MSG%', order_status);
								body = body.replace('%ORDER_TYPE%', 'Order Status');
								body = body.replace('%ORDER_NUMBER%',purchase_order_id);
								body = body.replace('%ITEM_NAME%',item_name);
								body = body.replace('%VENDOR_NAME%',vendor_name);
								body = body.replace('%REASON_FOR_CANCELLATION%',reason_for_cancellation);

								//body = body.replace('%LINK%', config.baseUrl + '/user-verify?email=' + email + "&email_verified_token=" + email_verified_token);

								sendEmail({
									to: email,
									subject: subject,
									html: body
								});
								return res.status(201).send(result);
							} else {
								return res.status(201).send(result);
							}
						}).catch(function (error) {
							console.log('Error :::', error);
							res.status(500).send("Internal server error");
							return;
						});
				}
			});

		}).catch(function (error) {
			console.log('Error :::', error);
			res.status(500).send("Internal server error");
			return
		});
}