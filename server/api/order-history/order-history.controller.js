'use strict';

const request = require('request');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
const statusCode = require('../../config/status');
const _ = require('lodash');
const carrierCode = require('../../config/carriers');
const orderStatusCode = require('../../config/order_status');
const sendEmail = require('../../agenda/send-email');
const async = require('async');
const populate = require('../../utilities/populate');
const orderItemStatus = require('../../config/order-item-status');
const moment = require('moment');
const numeral = require('numeral');
const Handlebars = require('handlebars');

var emailTemplateModel = "EmailTemplate";

export function updateStatusOld(req, res) {

	var paramsID, order_status, date;
	var bodyParams = {}, shippingInput = {};
	var orderStatusIncludeArr = [];

	paramsID = req.params.id;
	bodyParams = req.body;
	date = new Date();

	orderStatusIncludeArr = [
		{
			model: model['User'],
			where:{
				status: statusCode.ACTIVE
			},
			attributes:['id', 'user_contact_email', 'first_name']
		},
		{
			model: model['OrderItem'],
			where:{
				status: statusCode.ACTIVE
			},
			attributes:['id', 'product_id', 'quantity', 'final_price'],
			include:[
				{
					model: model['Product'],
					include: [
						{ 
							model: model['Vendor'],
							attributes:['id', 'vendor_name'],
						}
					],
					include: [
						{ 
							model: model['ProductMedia'],
							attributes:['id', 'url'],
						}
					],
					attributes:['id', 'vendor_id', 'product_name', 'product_slug'],
				}
			]
		}
	]

	if (bodyParams.provider_name) {
		shippingInput['provider_name'] = bodyParams.provider_name;
		delete bodyParams.provider_name;
	}

	if (bodyParams.tracking_id) {
		shippingInput['tracking_id'] = bodyParams.tracking_id;
		delete bodyParams.tracking_id;
	}

	if (bodyParams.order_status == orderStatusCode.CONFIRMEDORDER){
		order_status = orderStatusCode.CONFIRMEDORDER;
	}

	if (bodyParams.order_status == orderStatusCode.PROCESSINGORDER){
		order_status = 'processed';
	}

	if (bodyParams.order_status == orderStatusCode.DISPATCHEDORDER){
		order_status = 'dispatched';
		bodyParams['shipped_on'] = date;
	}

	if (bodyParams.order_status == orderStatusCode.DELIVEREDORDER){
		order_status = 'delivered';
		bodyParams['delivered_on'] = date;
	}

	bodyParams["last_updated_on"] = new Date();

	if (shippingInput.provider_name) {

		shippingInput['status'] = statusCode.ACTIVE;
		service.createRow('Shipping', shippingInput)
			.then(function(res) {
				
				bodyParams["shipping_id"] = res.id;
				orderStatusUpdate(paramsID, orderStatusIncludeArr, bodyParams, order_status, function(response) {
					console.log(response);
				});
			}).catch(function(err) {
				console.log(err);
				orderStatusUpdate(paramsID, orderStatusIncludeArr, bodyParams, order_status, function(response) {
					console.log(response);
				});
			})
	} else{
		
		orderStatusUpdate(paramsID, orderStatusIncludeArr, bodyParams, order_status, function(response) {
			console.log(response);
		});
	}
	return res.status(201).send("Updated");
}

export async function updateStatus(req, res) {
	req.checkBody('select_courier', 'Missing Query Param').notEmpty();
	req.checkBody('expected_delivery_date', 'Missing Query Param').notEmpty();
	req.checkBody('tracking_id', 'Missing Query Param').notEmpty();
	var errors = req.validationErrors();
	if (errors) {
		res.status(400).send('Missing Query Params');
		return;
	}

	if (new Date() > new Date(req.body.expected_delivery_date)) {
		return res.status(400).send("Invalid delivery date.");
	}

	let oredrId = req.params.id;

	try {
		
	} catch(error) {
		console.log('dispatch product Error:::', error);
		return res.status(500).send(error);
	}
}

function orderStatusUpdate(paramsID, orderStatusIncludeArr, bodyParams, order_status, res) {

	service.findIdRow("Order", paramsID, orderStatusIncludeArr)
		.then(function(updateOrder) {
			if (updateOrder) {
				delete bodyParams["id"];

				service.updateRow("Order", bodyParams, paramsID)
					.then(function(result) {
						if (result) {
							if (updateOrder.User.user_contact_email) {

								if(order_status == orderStatusCode.CONFIRMEDORDER){
									orderConfirmedByVendorMail(updateOrder);
								}else{

									var order_id = updateOrder.id;
									var user_email = updateOrder.User.user_contact_email;

									var queryObjEmailTemplate = {};
									queryObjEmailTemplate['name'] = config.email.templates.orderMail;

									service.findOneRow(emailTemplateModel, queryObjEmailTemplate)
										.then(function(response) {
											if (response) {
												var email = user_email;
												var subject = response.subject.replace('%ORDER_TYPE%', 'Order Status');
												var body;

												body = response.body.replace('%ORDER_MSG%', order_status);
												body = body.replace('%ORDER_TYPE%', 'Order Status');
												body = body.replace('%ORDER_NUMBER%', order_id);
												
												sendEmail({
													to: email,
													subject: subject,
													html: body
												});
												return result;
											} else {
												return result;
											}
										}).catch(function(error) {
											console.log('Error :::', error);
											return error;
										});
								}
							} else {
								return "Unable to sent";
							}
						} else {
							return null;
						}
					}).catch(function(error) {
						console.log('Error:::', error);
						return error;
					})
			}else{
				return null;
			}
		}).catch(function(error) {
			console.log('Error :::', error);
			return error;
		});
}

function orderConfirmedByVendorMail(updateOrder){
	var queryObjEmailTemplate = {}, data = {}, orderItems = [];
	var email, subject, body, template, result;

	queryObjEmailTemplate['name'] = config.email.templates.vendorOrderConformation;

	service.findOneRow(emailTemplateModel, queryObjEmailTemplate)
		.then(function(mailTemplate) {
			if(mailTemplate){

				orderItems = updateOrder.OrderItems;

				email = updateOrder.User.user_contact_email;
				subject = mailTemplate.subject;
				body = mailTemplate.body.replace(/%CURRENCY%/g, '$');
				body = body.replace('%USER_NAME%', updateOrder.User.first_name);
				//body = body.replace(/%VENDOR_NAME%/g, orderItems[0].Product.Vendor.vendor_name);
				body = body.replace(/%ORDER_ID%/g, updateOrder.id);
				body = body.replace('%PLACED_ON%', moment(updateOrder.created_on).format('MMM D, Y'));
				body = body.replace('%TOTAL_PRICE%', numeral(updateOrder.total_price).format('$' + '0,0.00'));

				template = Handlebars.compile(body);
				data = {
					OrderItems: orderItems
				};
				result = template(data);

				sendEmail({
					to: email,
					subject: subject,
					html: result
				});
				return;
			}
		}).catch(function(error){
			console.log("Error::",error);
		})
}

export function vendorCancel(req, res) {

	var item_name, user_email, vendor_name, reason_for_cancellation;

	var paramsID = req.params.id;
	var bodyParams = req.body;
	var includeArr = populate.populateData("User,OrderItem,OrderItem.Product,OrderItem.Product.Vendor");

	service.findIdRow("Order", paramsID, includeArr)
		.then(function(row) {

			var purchase_order_id = row.purchase_order_id;
			var orderItems = row.OrderItems;

			orderItems.forEach(function(element) {

				if (element.id == bodyParams.item_id) {
					if (row.User.user_contact_email) {

						item_name = element.Product.product_name;
						vendor_name = element.Product.Vendor.vendor_name;
						user_email = row.User.user_contact_email;

						var queryObjEmailTemplate = {};
						var emailTemplateModel = "EmailTemplate";
						queryObjEmailTemplate['name'] = config.email.templates.itemCancel;

						service.findOneRow(emailTemplateModel, queryObjEmailTemplate)
							.then(function(response) {
								if (response) {
									var email = user_email;
									reason_for_cancellation = bodyParams.reason_for_cancellation;
									var subject = response.subject.replace('%ORDER_TYPE%', 'Order Status');
									var body;
									body = response.body;
									body = body.replace('%ORDER_TYPE%', 'Order Status');
									body = body.replace('%ORDER_NUMBER%', purchase_order_id);
									body = body.replace('%ITEM_NAME%', item_name);
									body = body.replace('%VENDOR_NAME%', vendor_name);
									body = body.replace('%REASON_FOR_CANCELLATION%', reason_for_cancellation);

									//body = body.replace('%LINK%', config.baseUrl + '/user-verify?email=' + email + "&email_verified_token=" + email_verified_token);

									sendEmail({
										to: email,
										subject: subject,
										html: body
									});
									return res.status(201).send(response);
								} else {
									return res.status(201).send(response);
								}
							}).catch(function(error) {
								console.log('Error :::', error);
								res.status(500).send("Internal server error");
								return;
							});
					}
				}
			});
		}).catch(function(error) {
			console.log('Error :::', error);
			res.status(500).send("Internal server error");
			return
		});
}


export function returnRequest(req, res) {

	var currentUser, item_id, itemModel, emailTemplateModel, subject, mailBody;
	var mailObj = {}, emailTemplateQueryObj = {}, itemBodyParam = {}, itemIncludeArr = [];
	itemModel = 'OrderItem';
	itemIncludeArr = populate.populateData('Product,Product.Vendor,Product.Vendor.User');

	emailTemplateModel = "EmailTemplate";
	emailTemplateQueryObj['name'] = config.email.templates.returnRequest;
	emailTemplateQueryObj['status'] = statusCode.ACTIVE;

	if (req.params.id)
		item_id = req.params.id

	itemBodyParam['order_item_status'] = orderItemStatus.RETURN_IN_REVIEW;
	itemBodyParam['reason_for_return'] = req.body.reason_for_return;
	itemBodyParam['return_requested_on'] = new Date();

	service.findIdRow(itemModel, item_id, itemIncludeArr)
		.then(function(item) {
			service.updateRow(itemModel, itemBodyParam, item_id)
				.then(function(updatedRow) {
					let includeArr = [];
					var refundObj = {
						order_id: req.body.order_id,
						order_item_status: {
							$ne: 4
						},
					};
					var field = 'created_on';
					var order = "asc";
					service.findAllRows(itemModel, includeArr, refundObj, 0, null, field, order)
						.then(function(orderItemsList) {
							if (orderItemsList.count == "0") {
								let OrderItem = {
									reason_for_cancellation: req.body.reason_for_return,
									cancelled_on: new Date(),
									order_status: orderStatusCode['CANCELLEDORDER'],
									last_updated_by: req.user.first_name,
									last_updated_on: new Date()
								};
								var refundObj = {
									id: req.body.order_id
								};
								service.updateRecord('Order', OrderItem, refundObj);

							}

							if(item.Product.Vendor.User.user_contact_email){
								var item_name, order_id, vendor_name, quantity, user_name, reason_for_return, email;
								item_name = item.Product.product_name;
								order_id = item.order_id;
								vendor_name = item.Product.Vendor.vendor_name;
								quantity = item.quantity;
								user_name = req.user.first_name + ' ' + req.user.last_name;
								reason_for_return = req.body.reason_for_return;
								email = item.Product.Vendor.User.user_contact_email;
								returnRequestnotification(req.params.id,req.user);
								service.findOneRow(emailTemplateModel, emailTemplateQueryObj)
									.then(function(template) {
										var mailBody;
										var mailBody = template.body;
										subject = template.subject;
										mailBody = mailBody.replace('%VENDOR_NAME%', vendor_name);
										mailBody = mailBody.replace('%ITEM%', item_name);
										mailBody = mailBody.replace('%QUANTITY%', quantity);
										mailBody = mailBody.replace('%ORDER_ID%', order_id);
										mailBody = mailBody.replace('%USER%', user_name);
										mailBody = mailBody.replace('%REASON_FOR_RETURN%', reason_for_return);

										sendEmail({
											to: email,
											subject: subject,
											html: mailBody
										});
										return res.status(201).send("Return Request Email Sent");

									}).catch(function(error) {
										return res.status(400).send(error);
									});
							}else{
								return res.status(201).send("Return Request Email Sent");
							}
						}).catch(function(error) {
							return res.status(400).send(error);
						})
				}).catch(function(error) {
					return res.status(400).send(error);
				})
		}).catch(function(error) {
			return res.status(500).send(error);
		})
}

function returnRequestnotification(refundOrderitemsID, user) {
	var orderItemid = refundOrderitemsID;
	var includeArr = populate.populateData('Product,Product.ProductMedia,Product.Vendor,Product.Vendor.User,Order');
	var queryObj = {
		id: orderItemid
	}
	var field = 'created_on';
	var order = "asc";
	var orderRefundItemMail = service.findAllRows('OrderItem', includeArr, queryObj, 0, null, field, order).then(function(OrderRefundList) {
		if (OrderRefundList) {
			var orderRefundList = OrderRefundList.rows;
			var queryObjNotification = {};
	        var NotificationTemplateModel = 'NotificationSetting';
	        queryObjNotification['code'] = config.notification.templates.refundRequest;
	        service.findOneRow(NotificationTemplateModel, queryObjNotification)
		    .then(function(response) {
			var bodyParams = {};
			bodyParams.user_id = user.id;
			var description = response.description;
			description = description.replace('%FirstName%',user.first_name);
			description = description.replace('%LastName%',user.last_name);
			description = description.replace('%vendor_url%', '/vendor/' + user.Vendor.id);
			_.forOwn(orderRefundList, function(orders) {
				description = description.replace('%order.number%', orders.Order.id);
				description = description.replace('%track%', '/refund/' + orders.Order.id);
				description = description.replace('%Refund_Amount%', orders.Product.price);
			});
			bodyParams.description = description;
			bodyParams.name = response.name;
			bodyParams.code = response.code;
			bodyParams.is_read = 1;
			bodyParams.status = 1;
			bodyParams.created_on = new Date();
			bodyParams.created_by = user.first_name;
			service.createRow("Notification", bodyParams);
		});
		return;
	}
})
}