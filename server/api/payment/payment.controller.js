'use strict';
// import Handlebars from 'handlebars';
const async = require('async');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
const Handlebars = require('handlebars');
const populate = require('../../utilities/populate');
const status = require('../../config/status');
const orderStatus = require('../../config/order_status');
const paymentMethod = require('../../config/payment-method');
const _ = require('lodash');
const moment = require('moment');
const ORDER_ITEM_STATUS = require('../../config/order-item-status');
const ORDER_PAYMENT_TYPE = require('../../config/order-payment-type');
const uuidv1 = require('uuid/v1');
const sendEmail = require('../../agenda/send-email');
var notificationService = require('../../api/notification/notification.service')
const numeral = require('numeral');

const stripe = require('../../payment/stripe.payment');

const CURRENCY = 'usd';

export function makePayment(req, res) {
	res.clearCookie('applied_coupon');
	let user = req.user;
	let paymentSettingId = req.body.paymentSettingId;

	var checkoutObj;

	var paymentSetting;

	var createdOrders;

	var orderIdStore = [];

	processCheckout(req)
		.then(checkoutObjResult => {
			checkoutObj = checkoutObjResult;
			return service.findOneRow('PaymentSetting', {
				id: paymentSettingId,
				user_id: user.id
			}, []);
		}).then(paymentSettingResult => {
			paymentSetting = paymentSettingResult;

			var ordersByVendor = checkoutObj.ordersByVendor;
			var orderPromises = [];

			_.forOwn(ordersByVendor, function(order, vendorId) {
				orderPromises.push(createOrder(order));
			});

			return Promise.all(orderPromises);

		}).then(ordersWithItems => {
			createdOrders = ordersWithItems;
			var orderIds = [];
			console.log("ordersWithItems", ordersWithItems);
			for (var i = 0; i < ordersWithItems.length; i++) {
				orderIds.push(ordersWithItems[i].order.id);
			}
			console.log("stripe calling");
			let card_details = JSON.parse(paymentSetting.card_details);
			var desc = "GTC ORDER";
			var metadata = {};
			metadata.orders = JSON.stringify(orderIds);
			console.log("metadata", metadata);
			let amt = checkoutObj.totalPrice['grandTotal'];
			return stripe.chargeCustomerCard(user.stripe_customer_id, card_details.id, amt, desc, CURRENCY, metadata);
		}).then(charge => {
			console.log("charge", charge);
			var paymentModel = {
				paid_date: new Date(charge.created),
				paid_amount: charge.amount / 100.0,
				payment_method: paymentMethod['STRIPE'],
				status: status['ACTIVE'],
				payment_response: JSON.stringify(charge)
			};
			return service.createRow('Payment', paymentModel);
		}).then(paymentRow => {
			let orderPayments = [];
			for (let i = 0; i < createdOrders.length; i++) {
				var orderPaymentObj = {
					order_id: createdOrders[i].order.id,
					payment_id: paymentRow.id,
					order_payment_type: ORDER_PAYMENT_TYPE['ORDER_PAYMENT'],
					status: status['ACTIVE'],
					created_on: new Date(),
					created_by: req.user.first_name
				}
				orderPayments.push(service.createRow('OrderPayment', orderPaymentObj));
			}
			return Promise.all(orderPayments);
		}).then(orderPaymentRows => {
			let statusPromises = [];
			for (var i = 0; i < createdOrders.length; i++) {
				createdOrders[i].order.order_status = orderStatus['NEWORDER'];
				createdOrders[i].order.gtc_fees = 1.00;
				orderIdStore.push(createdOrders[i].order.id);
				statusPromises.push(service.updateRow('Order', createdOrders[i].order, createdOrders[i].order.id));
			}
			return Promise.all(statusPromises);
		}).then(orderUpdatedRows => {
			let quantityPromises = [];
			for (var i = 0; i < createdOrders.length; i++) {

				for (var j = 0; j < createdOrders[i].items.length; j++) {
					quantityPromises.push(updateQuantity(createdOrders[i].items[j].product_id, createdOrders[i].items[j].quantity));
				}
			}
			return Promise.all(quantityPromises);
		}).then(productQuantityUpdatedRow => {
			let clearCart = [];
			let allCartItems = checkoutObj.cartItems.rows;
			for (let j = 0; j < allCartItems.length; j++) {
				clearCart.push(allCartItems[j].id)
			}
			if(req.user.user_contact_email){
			sendOrderMail(orderIdStore, req);
			}
			service.destroyManyRow('Cart', clearCart).then(clearedCartRow => {
				if (!(_.isNull(clearedCartRow))) {
					return res.status(200).send({
						createdOrders: createdOrders
					});
				} else return res.status(500).send(err);
			});

		}).catch(err => {
			console.log("err3", err);
			if (createdOrders && createdOrders.length > 0) {
				var promises = [];
				for (var i = 0; i < createdOrders.length; i++) {
					createdOrders[i].order.order_status = orderStatus['FAILEDORDER'];
					createdOrders[i].order.gtc_fees = 1.00;
					promises.push(service.updateRow('Order', createdOrders[i].order, createdOrders[i].order.id));
				}
				Promise.all(promises).then(result => {
					return res.status(500).send(err);
				}).catch(error => {
					return res.status(500).send(err);
				});
			} else {
				return res.status(500).send(err);
			}
		});
}

function createOrder(orderWithItems) {
	var orderItems = JSON.parse(JSON.stringify(orderWithItems.items));
	delete orderWithItems.items;

	var order = orderWithItems;
	order.gtc_fees = 1.00;

	return service.createRow('Order', order).then(orderResult => {
		order.id = orderResult.id;
		console.log("order.id", order.id);
		var orderItemsPromises = [];
		for (var i = 0; i < orderItems.length; i++) {
			orderItems[i].order_id = orderResult.id;
			orderItems[i].order_item_status = 0;
			orderItemsPromises.push(createOrderItem(orderItems[i]));
		}
		return Promise.all(orderItemsPromises).then(itemsResults => {
			return Promise.resolve({
				order: orderResult,
				items: itemsResults
			});
		}).catch(err => {
			return Promise.reject(err);
		});
	}).catch(err => {
		return Promise.reject(err);
	});
}

function createOrderItem(orderItem) {
	return service.createRow('OrderItem', orderItem);
}

function updateQuantity(productId, placedQuantity) {
	return service.findIdRow('Product', productId)
		.then(product => {
			let quantityUpdate = {};
			let currentQuantity = product.quantity_available - placedQuantity;

			quantityUpdate.quantity_available = currentQuantity;

			if (currentQuantity == 0) {
				quantityUpdate.status = status['SOLDOUT'];
			}

			return service.updateRow('Product', quantityUpdate, productId)
				.then(upadtedRow => {
					return Promise.resolve(upadtedRow);
				}).catch(err => {
					return Promise.reject(err);
				})
		}).catch(err => {
			return Promise.reject(err);
		})
}

function processCheckout(req) {
	return new Promise((resolve, reject) => {
		var cartItems;
		var marketPlaces;
		var queryObj = {};
		let includeArr = [];

		var user_id = req.user.id;

		queryObj['user_id'] = user_id;

		queryObj['status'] = {
			'$eq': status["ACTIVE"]
		}

		model["Cart"].findAndCountAll({
			where: queryObj,
			include: [{
				model: model["User"],
				attributes: {
					exclude: ['hashed_pwd', 'salt', 'email_verified_token', 'email_verified_token_generated', 'forgot_password_token', 'forgot_password_token_generated']
				}
			}, {
				model: model["Product"],
				include: [{
					model: model["Vendor"]
				}, {
					model: model["Category"]
				}, {
					model: model["SubCategory"]
				}, {
					model: model["Marketplace"]
				}, {
					model: model["MarketplaceType"]
				}, {
					model: model["Country"]
				}, {
					model: model["State"]
				}, {
					model: model["ProductMedia"],
					where: {
						base_image: 1,
						status: {
							'$eq': status["ACTIVE"]
						}
					}
				}]
			}]
		}).then(function(data) {
			cartItems = JSON.parse(JSON.stringify(data));
			var searchObj = {};
			let includeArr = [];

			searchObj['status'] = {
				'$eq': status["ACTIVE"]
			}

			return service.findRows('Marketplace', searchObj, null, null, 'created_on', "asc", includeArr);
		}).then(function(marketPlaceData) {
			marketPlaces = JSON.parse(JSON.stringify(marketPlaceData));

			var totalItems = cartItems.rows;
			var allMarketPlaces = marketPlaces.rows;
			var totalPrice = {};
			var defaultShipping = 0;

			var totalPriceByVendor = {};

			totalPrice['grandTotal'] = 0;
			totalPriceByVendor['grandTotal'] = 0;

			var seperatedItems = _.groupBy(totalItems, "Product.Marketplace.code");

			var seperatedItemsByVendor = _.groupBy(totalItems, "Product.Vendor.id");

			console.log("seperatedItems", seperatedItems);
			console.log("seperatedItemsByVendor", seperatedItemsByVendor);

			_.forOwn(seperatedItems, function(itemsValue, itemsKey) {
				totalPrice[itemsKey] = {};
				totalPrice[itemsKey]['price'] = 0;
				totalPrice[itemsKey]['shipping'] = 0;
				totalPrice[itemsKey]['total'] = 0;

				for (var i = 0; i < itemsValue.length; i++) {

					if ((itemsKey == itemsValue[i].Product.Marketplace.code) && itemsValue[i].Product.price) {

						var calulatedSum = (itemsValue[i].quantity * itemsValue[i].Product.price);

						var calulatedShippingSum = (itemsValue[i].quantity * itemsValue[i].Product.shipping_cost);

						totalPrice[itemsKey]['price'] = totalPrice[itemsKey]['price'] + calulatedSum;
						totalPrice[itemsKey]['shipping'] = totalPrice[itemsKey]['shipping'] + calulatedShippingSum;
						totalPrice[itemsKey]['total'] = totalPrice[itemsKey]['price'] + totalPrice[itemsKey]['shipping'];
					}
				}

				totalPrice['grandTotal'] = totalPrice['grandTotal'] + totalPrice[itemsKey]['total'];
			});

			var ordersByVendor = {};
			var checkoutObj = {};

			_.forOwn(seperatedItemsByVendor, function(itemsValue, vendorId) {
				ordersByVendor[vendorId] = {};

				totalPriceByVendor[vendorId] = {};
				totalPriceByVendor[vendorId]['price'] = 0;
				totalPriceByVendor[vendorId]['shipping'] = 0;
				totalPriceByVendor[vendorId]['total'] = 0;

				for (var i = 0; i < itemsValue.length; i++) {

					if ((vendorId == itemsValue[i].Product.Vendor.id)) {

						var order = ordersByVendor[vendorId];
						if (Object.keys(order).length == 0) {
							// create order
							order['user_id'] = user_id;
							order['ordered_date'] = new Date();
							order['order_status'] = orderStatus['NEWORDER'];
							order['status'] = status['ACTIVE'];
							order['invoice_id'] = uuidv1();
							order['purchase_order_id'] = 'PO-' + uuidv1();
							order['created_by'] = req.user.first_name;
							order['created_on'] = new Date();
							order['billing_address_id'] = req.body.selected_billing_address_id;
							order['shipping_address_id'] = req.body.selected_shipping_address_id;

							order['items'] = [];
						}

						var calulatedSum = (itemsValue[i].quantity * itemsValue[i].Product.price);

						var calulatedShippingSum = (itemsValue[i].quantity * itemsValue[i].Product.shipping_cost);

						totalPriceByVendor[vendorId]['price'] = totalPriceByVendor[vendorId]['price'] + calulatedSum;
						totalPriceByVendor[vendorId]['shipping'] = totalPriceByVendor[vendorId]['shipping'] + calulatedShippingSum;
						totalPriceByVendor[vendorId]['total'] = totalPriceByVendor[vendorId]['price'] + totalPriceByVendor[vendorId]['shipping'];

						var final_price = (calulatedSum + calulatedShippingSum);
						var orderItem = {
							product_id: itemsValue[i].Product.id,
							quantity: itemsValue[i].quantity,
							subtotal: calulatedSum,
							shipping_total: calulatedShippingSum,
							final_price: final_price,
							status: status['ACTIVE']
						};

						order['total_price'] = totalPriceByVendor[vendorId]['total'];
						order['items'].push(orderItem);
					}
				}

				totalPriceByVendor['grandTotal'] = totalPriceByVendor['grandTotal'] + totalPriceByVendor[vendorId]['total'];

			});

			console.log("ordersByVendor", ordersByVendor);


			checkoutObj.ordersByVendor = ordersByVendor;
			checkoutObj.totalPriceByVendor = totalPriceByVendor;
			checkoutObj.totalPrice = totalPrice;
			checkoutObj.cartItems = cartItems;

			resolve(checkoutObj);

		}).catch(function(error) {
			console.log('Error:::', error);
			reject(error);
		});
	});
}

export function createCard(req, res) {
	let user = req.user;
	var paymentSetting;
	if (_.isUndefined(user.stripe_customer_id) || _.isNull(user.stripe_customer_id)) {
		stripe.createCustomer(user, req.body.token.id)
			.then(customer => {
				user.stripe_customer_id = customer.id;
				let card = customer.sources.data[0];
				//console.log(card);
				return savePaymentSetting(user, card, req.body.isPrimary);
			}).then(paymentSettingRes => {
				//console.log(paymentSetting);
				paymentSetting = paymentSettingRes;
				return service.updateRow('User', user, user.id);
			}).then(result => {
				//console.log(result);
				return res.status(200).send(paymentSetting);
			}).catch(err => {
				console.log(err);
				return res.status(500).send(err);
			});
	} else {
		stripe.addCard(user.stripe_customer_id, req.body.token.id, req.body.isPrimary)
			.then(card => {
				//console.log("card", card);
				return savePaymentSetting(user, card, req.body.isPrimary);
			}).then(result => {
				//console.log("result", result);
				paymentSetting = result;
				return res.status(200).send(paymentSetting);
			}).catch(err => {
				console.log("err", err);
				return res.status(500).send(err);
			});
	}
}

function savePaymentSetting(user, card, isPrimary) {
	let paymentSetting = {
		user_id: user.id,
		stripe_card_id: card.id,
		stripe_customer_id: user.stripe_customer_id,
		card_type: card.brand,
		status: status["ACTIVE"],
		isPrimary: isPrimary,
		card_details: JSON.stringify(card)
	};

	return service.createRow('PaymentSetting', paymentSetting);
}


function resMessage(message, messageDetails) {
	return {
		message: message,
		messageDetails: messageDetails
	};
}

export function cancelOrder(req, res) {
	if (!req.body)
		return res.status(400).send(resMessage("BAD_REQUEST", "Missing one or more required Parameters"));
	if (!req.body.reason_for_cancellation)
		return res.status(400).send(resMessage("BAD_REQUEST", "No Reason for cancellation"));

	let orderItem, paymentObj, refundObj;

	processCancelOrder(req)
		.then(orderItemObj => {
			orderItem = orderItemObj;
			let includeArray = [];
			includeArray = populate.populateData("Payment");
			let orderPaymentQueryObj = {
				order_id: orderItemObj.order_id,
				order_payment_type: ORDER_PAYMENT_TYPE['ORDER_PAYMENT']
			}
			return service.findRow('OrderPayment', orderPaymentQueryObj, includeArray);
		}).then(paymentRow => {
			paymentObj = JSON.parse(JSON.stringify(paymentRow));
			let chargedPaymentRes = JSON.parse(paymentObj.Payment.payment_response);
			let refundAmt = parseInt(orderItem.final_price);
			return stripe.refundCustomerCard(chargedPaymentRes.id, refundAmt);
		}).then(refundRow => {
			refundObj = refundRow;
			let paymentModel = {
				refund_date: new Date(refundRow.created),
				refund_amount: refundRow.amount / 100.0,
				payment_method: paymentMethod['STRIPE'],
				status: status['ACTIVE'],
				payment_response: JSON.stringify(refundRow),
				created_by: req.user.first_name,
				created_on: new Date()
			};
			return service.createRow('Payment', paymentModel);
		}).then(createdPaymentRow => {
			let orderPaymentModel = {
				order_id: orderItem.order_id,
				payment_id: createdPaymentRow.id,
				order_payment_type: ORDER_PAYMENT_TYPE['REFUND'],
				status: status['ACTIVE'],
				created_by: req.user.first_name,
				created_on: new Date()
			}
			return service.createRow('OrderPayment', orderPaymentModel);
		}).then(createdOrderPaymentRow => {
			let updateOrderItem = {
				reason_for_cancellation: req.body.reason_for_cancellation,
				cancelled_on: new Date(),
				order_item_status: ORDER_ITEM_STATUS['ORDER_CANCELLED_AND_REFUND_INITIATED'],
				last_updated_by: req.user.first_name,
				last_updated_on: new Date()
			}
			return service.updateRow('OrderItem', updateOrderItem, orderItem.id);
		}).then(updatestatusRow => {
			let includeArr = [];
			refundObj = {
				order_id: orderItem.order_id,
				order_item_status: {
					$ne: ORDER_ITEM_STATUS['ORDER_CANCELLED_AND_REFUND_INITIATED']
				},
			};
			var field = 'created_on';
			var order = "asc";
			return service.findAllRows('OrderItem', includeArr, refundObj, 0, null, field, order);
		}).then(successPromise => {
			if (successPromise.count == "0") {
				let OrderItemRefund = {
					reason_for_cancellation: req.body.reason_for_cancellation,
					cancelled_on: new Date(),
					order_status: orderStatus['CANCELLEDORDER'],
					last_updated_by: req.user.first_name,
					last_updated_on: new Date()
				};
				refundObj = {
					id: orderItem.order_id
				};
				service.updateRecord('Order', OrderItemRefund, refundObj);
				return res.status(200).send(resMessage("SUCCESS", "Order Cancelled and Refund Initiated. Credited to bank account to 5 to 7 bussiness days"));

			} else {
				return res.status(200).send(resMessage("SUCCESS", "Order Cancelled and Refund Initiated. Credited to bank account to 5 to 7 bussiness days"));
			}
		}).catch(error => {
			console.log("Error", error)
			return res.status(500).send(error);
		});
}

function processCancelOrder(req) {
	return new Promise((resolve, reject) => {
		let includeArray = [];
		includeArray = populate.populateData("Order,Product");
		service.findRow('OrderItem', {
				id: req.params.orderItemId
			}, includeArray)
			.then(orderItemRow => {
				orderItemRow = JSON.parse(JSON.stringify(orderItemRow));
				if (orderItemRow.order_item_status === ORDER_ITEM_STATUS['ORDER_CANCELLED_AND_REFUND_INITIATED'] || orderItemRow.order_item_status === ORDER_ITEM_STATUS['REFUND_FAILED'])
					return reject(resMessage("BAD_REQUEST", "Refund already processing"));

				if (orderItemRow.Order.user_id === req.user.id)
					return resolve(orderItemRow);
				else if (req.user.VendorStatus && req.user.Vendor && (orderItemRow.Product.vendor_id === req.user.Vendor.id))
					return resolve(orderItemRow);
				else
					return reject(resMessage("BAD_REQUEST", "Access Denied, Not Authorized to cancel the order"));
			}).catch(err => {
				return reject(resMessage("BAD_REQUEST", "Order item Not Found"));
			});
	});
}

export function deleteCard(req, res) {
	service.findRow('PaymentSetting', {
			id: req.body.paymentSettingId
		}, [])
		.then(paymentSetting => {
			console.log("paymentSetting", paymentSetting);
			if (paymentSetting && paymentSetting.user_id === req.user.id) {
				return service.destroyRow('PaymentSetting', req.body.paymentSettingId);
			} else {
				return Promise.reject('Not Found');
			}
		}).then(result => {
			return res.status(200).send({});
		}).catch(err => {
			return res.status(500).send(err);
		});
}

export function sendOrderMail(orderIdStore,req) {
	var user = {};
	user=req.user;
	var orderIdStore = orderIdStore;
	var includeArr = [{
		model: model['OrderItem'],
		include: [{
			model: model['Product'],
			include: [{
				"model": model['Vendor'],
				attributes: ['id'],
				include: [{
					model: model['User'],
					attributes: ['id', 'email'],
				}]
			},{
			model:model['ProductMedia'],
			attributes:['url']
		}],
		}]
	}, {
		model: model['Address'],
		as: 'shippingAddress',
		include: [{
			model: model['State']
		}, {
			model: model['Country']
		}, ]
	}]
	console.log(orderIdStore);
	var queryObj = {
		id: orderIdStore
	}
	var field = 'created_on';
	var order = "asc";
	var orderItemMail = service.findAllRows('Order', includeArr, queryObj, 0, null, field, order).then(function(OrderList) {
		if (OrderList) {
			console.log(JSON.stringify(OrderList))
			if(user.user_contact_email){

				vendorMail(OrderList, user);
				var user_email = user.user_contact_email;
				var orderNew = [];
				var queryObjEmailTemplate = {};
				var emailTemplateModel = "EmailTemplate";
				queryObjEmailTemplate['name'] = config.email.templates.userOrderDetail;
				service.findOneRow(emailTemplateModel, queryObjEmailTemplate)
					.then(function(response) {
						if (response) {
							var email = user_email;
							var subject = response.subject.replace('%ORDER_TYPE%', 'Order Status');
							var body;
							body = response.body.replace('%ORDER_TYPE%', 'Order Status');
							body = body.replace('%Path%',req.protocol + '://' + req.get('host'));
							body = body.replace('%currency%','$');
							body = body.replace('%UserName%',user.first_name) //+' '+user.last_name
							if(user.last_name != null || user.last_name != 'null'){
							body = body.replace('%UserLastName%',user.last_name) //+' '+		
							}
							_.forOwn(OrderList.rows, function(orders) {
								body = body.replace('%placed_on%',moment(orders.created_on).format('MMM D, Y'));
								body = body.replace('%Total_Price%',numeral(orderPayments.total_price).format('$' + '0,0.00'))
								orderNew.push(orders);
							});
							var template = Handlebars.compile(body);
							var data = {
								order: orderNew
							};
							var result = template(data);
							sendEmail({
								to: email,
								subject: subject,
								html: result
							});
							return;
						} else {
							return;
						}
					}).catch(function(error) {
						console.log('Error :::', error);
						return;
					});
			}
			return;
		}

	}).catch(function(error) {
		console.log('Error :::', error);
		return;
	});
}
export function vendorMail(OrderList, user) {
	var orderNew = [];
	var notification = [];
	_.forOwn(OrderList.rows, function(orders) {
		orderNew.push(sendVendorEmail(orders, user));
		notification.push(notifications(orders));
	});
	return Promise.all(orderNew, notification);
}

function sendVendorEmail(order, user) {

	var queryObjEmailTemplate = {};
	var emailTemplateModel = 'EmailTemplate';
	queryObjEmailTemplate['name'] = config.email.templates.vendorNewOrder;
	service.findOneRow(emailTemplateModel, queryObjEmailTemplate)
		.then(function(response) {
			if(order.OrderItems[0].Product.Vendor.User.user_contact_email){
				var email = order.OrderItems[0].Product.Vendor.User.user_contact_email;
				var subject = response.subject.replace('%ORDER_TYPE%', 'New Order');
				var body;
				body = response.body.replace('%ORDER_TYPE%', 'New Order');
				body = body.replace('%ORDER_NUMBER%', order.id);
				body = body.replace('%PLACED_BY%', user.first_name);
				body = body.replace('%COMPANY_NAME%', order.shippingAddress.company_name ? order.shippingAddress.company_name : '');
				body = body.replace('%ADDRESS_LINE_1%', order.shippingAddress.address_line1 ? order.shippingAddress.address_line1 : '');
				body = body.replace('%ADDRESS_LINE_2%', order.shippingAddressaddress_line2 ? order.shippingAddress.address_line2 : '');
				body = body.replace('%CITY%', order.shippingAddress.city ? order.shippingAddress.city : '');
				body = body.replace('%STATE%', order.shippingAddress.State.name ? order.shippingAddress.State.name : '');
				body = body.replace('%COUNTRY%', order.shippingAddress.Country.name ? order.shippingAddress.Country.name : '');
				var template = Handlebars.compile(body);
				var data = {
					order: order
				};
				var result = template(data);
				sendEmail({
					to: email,
					subject: subject,
					html: result
				});
			}
			return;
		}).catch(function(error) {
			console.log('Error :::', error);
			return;
		})
}

function notifications(order) {
	var queryObjNotification = {};
	var NotificationTemplateModel = 'NotificationSetting';
	queryObjNotification['code'] = config.notification.templates.vendorNewOrder;
	service.findOneRow(NotificationTemplateModel, queryObjNotification)
		.then(function(response) {
			var bodyParams = {};
			bodyParams.user_id = order.OrderItems[0].Product.Vendor.User.id;
			bodyParams.description = response.description.replace('%#Order%', '/my-order/order/' + order.id);
			bodyParams.name = response.name;
			bodyParams.code = response.code;
			bodyParams.is_read = 1;
			bodyParams.status = 1;
			bodyParams.created_on = new Date();
			service.createRow("Notification", bodyParams);
		});
}

// plan payment method starts//
export function makeplanPayment(req, res) {
	var desc = "GTC Plan Payment";
	var convertMoment = moment();
	var start_date = new Date(convertMoment);
	var end_date = moment().add(28, 'd').toDate();
	stripe.chargeCustomerplanCard(req.body.stripe_customer_id, req.body.carddetailsid, req.body.amount, desc, CURRENCY).
	then(function(response) {
		if (response.paid = "true") {
			var paymentModel = {
				paid_date: new Date(response.created),
				paid_amount: response.amount / 100.0,
				payment_method: paymentMethod['STRIPE'],
				status: status['ACTIVE'],
				payment_response: JSON.stringify(response)
			};
			service.createRow('Payment', paymentModel);
			if (req.body.vendor_id != 0) {

				var vendorplanModel = {
					vendor_id: req.body.vendor_id,
					plan_id: req.body.plan_id,
					status: status['ACTIVE'],
					auto_renewal_mail:req.body.autoRenewalMail,
					start_date: start_date,
					end_date: end_date

				};
				service.createRow('VendorPlan', vendorplanModel);
					if(req.user.user_contact_email){
						sendUpgrademail(req.body.plan_id, req.user);
					}
				return res.status(200).json({
					data: response
				});
			} else {
				if(req.user.user_contact_email){
					sendUpgrademail(req.body.plan_id, req.user);
				}
					var userplanModel = {
					user_id: req.body.user_id,
					plan_id: req.body.plan_id,
					auto_renewal_mail:req.body.autoRenewalMail,
					status: status['ACTIVE'],
					start_date: start_date,
					end_date: end_date
					};
					service.createRow('UserPlan', userplanModel);
					return res.status(200).json({
					data: response
					});
                   }
		} else {
			return res.status(500).json({
				data: err
			});
		}
	});
}
//plan payment method ends//


//plan upgrade email starts//
function sendUpgrademail(plan_id, user) {
	var includeArray = [];
	let upgradePlanModel = {
		id: plan_id
	}
	return service.findRow('Plan', upgradePlanModel, includeArray)
		.then(upgradeplandetails => {
			var upgradeplanobj = upgradeplandetails;
			var queryObjEmailTemplate = {};
			var emailTemplateModel = 'EmailTemplate';
			queryObjEmailTemplate['name'] = config.email.templates.upgradeplan;
			service.findOneRow(emailTemplateModel, queryObjEmailTemplate)
				.then(function(response) {
					var email = user.user_contact_email;
					var subject = response.subject;
					var body;
					var body = response.body;
					body = body.replace('%first_name%', user.first_name);
					body = body.replace('%name%', upgradeplanobj.name);
					body = body.replace('%cost%', upgradeplanobj.cost);
					sendEmail({
						to: email,
						subject: subject,
						html: body
					});
				}).catch(function(error) {
					console.log('Error :::', error);
					return;
				})
		})

}
//plan upgrade email ends//


export function refundOrder(req, res) {
	var userdetails = req.user;
	var refundOrderitemsID = [];
	var refundsOrderitems = JSON.parse(req.body.refundOrderItems);
	for (var i = 0; i < refundsOrderitems.length; i++) {
		refundOrderitemsID.push(refundsOrderitems[i]);
	}


	var order_id, paymentObj, refundObj, refundAmt, order;
	order_id = req.params.orderId;
	refundAmt = req.body.total_refund;
	let includeArray = [];
	includeArray = populate.populateData("Payment");
	let orderPaymentQueryObj = {
		order_id: order_id,
		order_payment_type: ORDER_PAYMENT_TYPE['ORDER_PAYMENT']
	}
	return service.findRow('OrderPayment', orderPaymentQueryObj, includeArray)
		.then(paymentRow => {
			paymentObj = JSON.parse(JSON.stringify(paymentRow));
			let chargedPaymentRes = JSON.parse(paymentObj.Payment.payment_response);
			return stripe.refundCustomerCard(chargedPaymentRes.id, refundAmt);
		})
		.then(refundRow => {

			refundObj = refundRow;
			let paymentModel = {
				refund_date: new Date(refundRow.created),
				refund_amount: refundRow.amount / 100.0,
				payment_method: paymentMethod['STRIPE'],
				status: status['ACTIVE'],
				payment_response: JSON.stringify(refundRow),
				created_by: req.user.first_name,
				created_on: new Date()
			};
			return service.createRow('Payment', paymentModel);


		})
		.then(createdPaymentRow => {
			console.log("enterrrlooops" + parseFloat(createdPaymentRow.refund_amount).toFixed(2));
			var refundamt = parseFloat(createdPaymentRow.refund_amount).toFixed(2);
			if(req.user.user_contact_email){
				sendRefundOrderMail(refundOrderitemsID, req.user, refundamt);
			}
			let orderPaymentModel = {
				order_id: order_id,
				payment_id: createdPaymentRow.id,
				order_payment_type: ORDER_PAYMENT_TYPE['REFUND'],
				status: status['ACTIVE'],
				created_by: req.user.first_name,
				created_on: new Date()
			}
			return service.createRow('OrderPayment', orderPaymentModel);
		}).then(createdOrderPaymentRow => {
			var refundsOrderitems = JSON.parse(req.body.refundOrderItems);
			for (var i = 0; i < refundsOrderitems.length; i++) {
				var orderItemid = refundsOrderitems[i];
				let updateOrderItem = {
					reason_for_cancellation: req.body.reason_for_cancellation,
					cancelled_on: new Date(),
					order_item_status: ORDER_ITEM_STATUS['ORDER_CANCELLED_AND_REFUND_INITIATED'],
					last_updated_by: req.user.first_name,
					last_updated_on: new Date()
				};
				refundObj = {
					id: orderItemid
				};
				return service.updateRecord('OrderItem', updateOrderItem, refundObj);
			}
		}).then(updatestatusRow => {
			let includeArr = [];
			refundObj = {
				order_id: order_id,
				order_item_status: {
					$ne: 1
				},
			};
			var field = 'created_on';
			var order = "asc";
			return service.findAllRows('OrderItem', includeArr, refundObj, 0, null, field, order);

		}).then(successPromise => {
			if (successPromise.count == "0") {
				let OrderItem = {
					reason_for_cancellation: req.body.reason_for_cancellation,
					cancelled_on: new Date(),
					order_status: orderStatus['RETURNEDORDER'],
					last_updated_by: req.user.first_name,
					last_updated_on: new Date()
				};
				refundObj = {
					id: order_id
				};
				service.updateRecord('Order', OrderItem, refundObj);
				return res.status(200).send(resMessage("SUCCESS", "Order Cancelled and Refund Initiated. Credited to bank account to 5 to 7 bussiness days"));
			} else {
				return res.status(200).send(resMessage("SUCCESS", "Order Cancelled and Refund Initiated. Credited to bank account to 5 to 7 bussiness days"));
			}

		}).catch(error => {
			console.log("Error", error)
			return res.status(500).send(error);
		});
}
export function sendRefundOrderMail(refundOrderitemsID, user, refundamount) {
	var orderItemid = refundOrderitemsID;
	var includeArr = populate.populateData('Product,Product.Vendor,Product.Vendor.User,Order');
	var queryObj = {
		id: orderItemid
	}
	var field = 'created_on';
	var order = "asc";
	var orderRefundItemMail = service.findAllRows('OrderItem', includeArr, queryObj, 0, null, field, order).then(function(OrderRefundList) {
		if (OrderRefundList) {
			var orderRefundList = OrderRefundList.rows;
			var vendor_email = user.user_contact_email;
			var orderNew = [];
			var queryObjEmailTemplate = {};
			var emailTemplateModel = 'EmailTemplate';
			queryObjEmailTemplate['name'] = config.email.templates.refundRequest;
			service.findOneRow(emailTemplateModel, queryObjEmailTemplate)
				.then(function(response) {
					var email = vendor_email;
					var subject = response.subject.replace('%ORDER_TYPE%', 'Refund Order');
					var body;
					body = response.body.replace('%VENDOR_NAME%', user.first_name);
					body = response.body.replace('%refundamount%', refundamount);
					_.forOwn(orderRefundList, function(orders) {
						body = body.replace('%ORDER_NUMBER%', orders.Order.id);
						orderNew.push(orders);
					});
					var template = Handlebars.compile(body);
					var data = {
						order: orderNew
					};
					var result = template(data);
					sendEmail({
						to: email,
						subject: subject,
						html: result
					});
				}).catch(function(error) {
					console.log('Error :::', error);
					return;
				})
		}
	})
}