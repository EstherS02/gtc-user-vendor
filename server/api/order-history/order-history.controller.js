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
const addressCode = require('../../config/address');
const trackingUrlCode = require('../../config/tracking-url');
const moment = require('moment');
const numeral = require('numeral');
const Handlebars = require('handlebars');

var emailTemplateModel = "EmailTemplate";
var notificationTemplateModel = 'NotificationSetting';

export function updateStatus(req, res) {

	var paramsID, date;
	var bodyParams = {}, shippingInput = {};

	paramsID = req.params.id;
	bodyParams = req.body;
	date = new Date();

	if (bodyParams.provider_name) {
		shippingInput['provider_name'] = bodyParams.provider_name;
		delete bodyParams.provider_name;
	}

	if (bodyParams.tracking_id) {
		shippingInput['tracking_id'] = bodyParams.tracking_id;
		delete bodyParams.tracking_id;
	}

	if (bodyParams.order_status == orderStatusCode.DISPATCHEDORDER){
		bodyParams['shipped_on'] = date;
	}

	if (bodyParams.order_status == orderStatusCode.DELIVEREDORDER){
		bodyParams['delivered_on'] = date;
	}

	bodyParams["last_updated_by"] = req.user.Vendor.vendor_name;
	bodyParams["last_updated_on"] = new Date();

	if (shippingInput.provider_name) {

		shippingInput['status'] = statusCode.ACTIVE;
		service.createRow('Shipping', shippingInput)
			.then(function(res) {
				
				bodyParams["shipping_id"] = res.id;
				return orderStatusUpdate(paramsID, bodyParams);
			}).catch(function(error) {
				return orderStatusUpdate(paramsID, bodyParams);
			})
	} else{
		orderStatusUpdate(paramsID, bodyParams);
	}
	return res.status(201).send("Updated");
}

function orderStatusUpdate(paramsID, bodyParams) {
	var orderStatusIncludeArr = [], updateOrder = {};

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
						},
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

	return service.findIdRow("Order", paramsID, orderStatusIncludeArr)
		.then(function(Order){
			updateOrder = Order;
			delete bodyParams['id'];
			return service.updateRow("Order", bodyParams, paramsID);

		}).then(function(updatedOrder){
			if (updatedOrder) {
				if (updateOrder.User.user_contact_email) {
					if(bodyParams.order_status == orderStatusCode.CONFIRMEDORDER){
						orderConfirmedByVendorMail(updateOrder);
						return;
					}else if(bodyParams.order_status == orderStatusCode.DISPATCHEDORDER){
						orderShippedByVendorMail(updateOrder);
						return;
					}else if(bodyParams.order_status == orderStatusCode.DELIVEREDORDER){
						orderDeliveredMail(updateOrder);
						return;
					}
				}
			}
			return;
		}).catch(function(error) {
			console.log('Error :::', error);
			return error;
		})
}

function orderConfirmedByVendorMail(updateOrder){
	var queryObjEmailTemplate = {}, data = {}, orderItems = [];
	var email, subject, body, template, result;

	queryObjEmailTemplate['name'] = config.email.templates.vendorOrderConformation;

	return service.findOneRow(emailTemplateModel, queryObjEmailTemplate)
		.then(function(mailTemplate) {

			orderItems = updateOrder.OrderItems;

			email = updateOrder.User.user_contact_email;
			subject = mailTemplate.subject;
			body = mailTemplate.body.replace(/%CURRENCY%/g, '$');
			body = body.replace('%USER_NAME%', updateOrder.User.first_name);
			body = body.replace(/%VENDOR_NAME%/g,updateOrder.OrderItems[0].Product.Vendor.vendor_name);
			body = body.replace(/%ORDER_ID%/g, updateOrder.id);
			body = body.replace('%PLACED_ON%', moment(updateOrder.ordered_date).format('MMM D, Y'));
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
			var notificationQueryObj ={};
			notificationQueryObj['code'] = config.notification.templates.orderStatus;

			return service.findOneRow(notificationTemplateModel, notificationQueryObj);
		}).then(function(notificationTemplate){
			var description, notificationBodyParam = {};
			description = notificationTemplate.description.replace(/%ORDER_ID%/g,updateOrder.id);
			description = description.replace('%ORDER_STATUS%', 'Confirmed by seller');

			notificationBodyParam.user_id = updateOrder.User.id;
			notificationBodyParam.description = description;
			notificationBodyParam.name = notificationTemplate.name;
			notificationBodyParam.code = notificationTemplate.code;
			notificationBodyParam.is_read = 1;
			notificationBodyParam.status = statusCode.ACTIVE;
			notificationBodyParam.created_on = new Date();
			notificationBodyParam.created_by = updateOrder.OrderItems[0].Product.Vendor.vendor_name;

			return service.createRow('Notification', notificationBodyParam);
		}).catch(function(error){
			console.log("Error::",error);
			return;
		})
}

function orderShippedByVendorMail(updateOrder){
	var queryObjEmailTemplate = {}, order = {}, orderIncludeArr=[];
	var email, subject, body, trackingUrl, totalItems;

	totalItems = updateOrder.OrderItems.length;

	queryObjEmailTemplate['name'] = config.email.templates.vendorOrderShipped;

	orderIncludeArr = [
		{
			model: model['Shipping'],
			where:{
				status: statusCode.ACTIVE
			},
			attributes:['id', 'provider_name', 'tracking_id']
		},
		{
			model: model['Address'],
			as: 'shippingAddress',
			where:{
				status: statusCode.ACTIVE
			},
			include: [
				{ 
					model: model['State'],
					attributes:['id', 'name'],
					where:{
						status: statusCode.ACTIVE
					}
				},
				{ 
					model: model['Country'],
					attributes:['id', 'name'],
					where:{
					status: statusCode.ACTIVE
					}
				}
			],
			attributes:['id', 'address_line1', 'address_line2','province_id','country_id', 'city']
		},
		{
			model: model['Address'],
			as: 'billingAddress',
			where:{
				status: statusCode.ACTIVE
			},
			include: [
				{ 
					model: model['State'],
					attributes:['id', 'name'],
					where:{
						status: statusCode.ACTIVE
					}
				},
				{ 
					model: model['Country'],
					attributes:['id', 'name'],
					where:{
					status: statusCode.ACTIVE
					}
				}
			],
			attributes:['id', 'address_line1', 'address_line2','province_id','country_id', 'city']
		}
	];
	return service.findIdRow('Order', updateOrder.id,orderIncludeArr)
	.then(function(Order){
		order = Order;
		return service.findOneRow(emailTemplateModel, queryObjEmailTemplate)
	}).then(function(mailTemplate){

		trackingUrl = (_.invert(trackingUrlCode))[order.Shipping.provider_name]+'/'+ order.Shipping.tracking_id;

		email = updateOrder.User.user_contact_email;
		subject = mailTemplate.subject.replace('%ORDER_ID%',updateOrder.id);
		body = mailTemplate.body.replace('%USER_NAME%', updateOrder.User.first_name);
		body = body.replace(/%VENDOR_NAME%/g, updateOrder.OrderItems[0].Product.Vendor.vendor_name);
		body = body.replace('%ORDER_ID%',updateOrder.id);
		body = body.replace('%ORDERED_DATE%', moment(updateOrder.ordered_date).format('MMM D, Y'));
		body = body.replace('%SHIPPED_DATE%', moment(order.shipped_on).format('MMM D, Y'));
		body = body.replace('%TOTAL_CHARGE%', numeral(updateOrder.total_price).format('$' + '0,0.00'));
		body = body.replace('%SHIPPING_METHOD%', 'Standard Shipping');
		body = body.replace('%SHIPPING_ADDRESS_LINE1%', order.shippingAddress.address_line1);
		body = body.replace('%SHIPPING_ADDRESS_LINE2%', order.shippingAddress.address_line2);
		body = body.replace('%SHIPPING_CITY%', order.shippingAddress.city);
		body = body.replace('%SHIPPING_STATE%', order.shippingAddress.State.name);
		body = body.replace('%SHIPPING_COUNTRY%', order.shippingAddress.Country.name);
		body = body.replace('%BILLING_ADDRESS_LINE1%', order.billingAddress.address_line1);
		body = body.replace('%BILLING_ADDRESS_LINE2%', order.billingAddress.address_line2);
		body = body.replace('%BILLING_CITY%', order.billingAddress.city);
		body = body.replace('%BILLING_STATE%', order.billingAddress.State.name);
		body = body.replace('%BILLING_COUNTRY%', order.billingAddress.Country.name);
		body = body.replace('%TRACKING_URL%', trackingUrl);
		body = body.replace('%TOTAL_ITEM%', totalItems);

		sendEmail({
			to: email,
			subject: subject,
			html: body
		});

		var notificationQueryObj ={};
		notificationQueryObj['code'] = config.notification.templates.orderStatus;

		return service.findOneRow(notificationTemplateModel, notificationQueryObj);
	}).then(function(notificationTemplate){
		
		var description, notificationBodyParam = {};
		description = notificationTemplate.description.replace(/%ORDER_ID%/g,updateOrder.id);
		description = description.replace('%ORDER_STATUS%', 'Shipped');

		notificationBodyParam.user_id = updateOrder.User.id;
		notificationBodyParam.description = description;
		notificationBodyParam.name = notificationTemplate.name;
		notificationBodyParam.code = notificationTemplate.code;
		notificationBodyParam.is_read = 1;
		notificationBodyParam.status = statusCode.ACTIVE;
		notificationBodyParam.created_on = new Date();
		notificationBodyParam.created_by = updateOrder.OrderItems[0].Product.Vendor.vendor_name;

		return service.createRow('Notification', notificationBodyParam);
	}).catch(function(error){
		console.log("Error::",error);
		return;
	})
}

function orderDeliveredMail(updateOrder){

	var queryObjEmailTemplate = {}, orderIncludeArr=[],order={};
	var email, subject, body;

	queryObjEmailTemplate['name'] = config.email.templates.orderDelivered;

	orderIncludeArr = [
		{
			model: model['Address'],
			as: 'shippingAddress',
			where:{
				status: statusCode.ACTIVE
			},
			include: [
				{ 
					model: model['State'],
					attributes:['id', 'name'],
					where:{
						status: statusCode.ACTIVE
					}
				},
				{ 
					model: model['Country'],
					attributes:['id', 'name'],
					where:{
					status: statusCode.ACTIVE
					}
				}
			],
		}
	];

	return service.findIdRow('Order', updateOrder.id,orderIncludeArr)
	.then(function(Order){
		order = Order;
		return service.findOneRow(emailTemplateModel, queryObjEmailTemplate)
	}).then(function(mailTemplate){

		email = updateOrder.User.user_contact_email;
		subject = mailTemplate.subject.replace('%ORDER_ID%',updateOrder.id);
		body = mailTemplate.body.replace('%USER_NAME%', updateOrder.User.first_name);
		body = body.replace('%ORDER_ID%', updateOrder.id);
		body = body.replace('%DELIVERED_DATE%', moment(order.delivered_on).format('MMM D, Y'));
		body = body.replace('%ADDRESS_LINE1%', order.shippingAddress.address_line1);
		body = body.replace('%ADDRESS_LINE2%', order.shippingAddress.address_line2);
		body = body.replace('%CITY%', order.shippingAddress.city);
		body = body.replace('%STATE%', order.shippingAddress.State.name);
		body = body.replace('%COUNTRY%', order.shippingAddress.Country.name);

		sendEmail({
			to: email,
			subject: subject,
			html: body
		});
		var notificationQueryObj ={};
		notificationQueryObj['code'] = config.notification.templates.orderStatus;

		return service.findOneRow(notificationTemplateModel, notificationQueryObj);
	}).then(function(notificationTemplate){
		var description, notificationBodyParam = {};
		description = notificationTemplate.description.replace(/%ORDER_ID%/g,updateOrder.id);
		description = description.replace('%ORDER_STATUS%', 'Delivered');

		notificationBodyParam.user_id = updateOrder.User.id;
		notificationBodyParam.description = description;
		notificationBodyParam.name = notificationTemplate.name;
		notificationBodyParam.code = notificationTemplate.code;
		notificationBodyParam.is_read = 1;
		notificationBodyParam.status = statusCode.ACTIVE;
		notificationBodyParam.created_on = new Date();
		notificationBodyParam.created_by = updateOrder.OrderItems[0].Product.Vendor.vendor_name;

		return service.createRow('Notification', notificationBodyParam);
	}).catch(function(error){
		console.log("Error::",error);
		return;
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
	        queryObjNotification['code'] = config.notification.templates.refundRequest;
	        service.findOneRow(notificationTemplateModel, queryObjNotification)
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