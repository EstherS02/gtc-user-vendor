'use strict';

const async = require('async');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
const Handlebars = require('handlebars');
const populate = require('../../utilities/populate');
const status = require('../../config/status');
const orderStatus = require('../../config/order_status');
const orderStatusNew = require("../../config/order-item-new-status");
const paymentMethod = require('../../config/payment-method');
const marketPlaceCode = require('../../config/marketplace');
const _ = require('lodash');
const moment = require('moment');
const ORDER_ITEM_STATUS = require('../../config/order-item-status');
const ORDER_ITEM_NEW_STATUS = require('../../config/order-item-new-status');
const ORDER_PAYMENT_TYPE = require('../../config/order-payment-type');
const uuidv1 = require('uuid/v1');
const sendEmail = require('../../agenda/send-email');
var notificationService = require('../../api/notification/notification.service')
const numeral = require('numeral');
const durationCode = require('../../config/duration-unit');
const gtcPlan = require('../../config/gtc-plan');
const cartService = require('../../api/cart/cart.service');

const stripe = require('../../payment/stripe.payment');

const CURRENCY = config.order.currency;

export async function makePayment(req, res) {
	var vendorArray = [];
	var cartItems = [];
	var cartEmptyPromises = [];
	var orderItemsPromises = [];
	var orderVendorPromises = [];
	var productQuantityPromises = [];
	const cartModelName = "Cart";
	const productModelName = "Product";
	const paymentModelName = "Payment";
	const orderModelName = "Order";
	const orderVendorModelName = "OrderVendor";
	const orderItemModelName = "OrderItem";
	const paymentSettingModelName = "PaymentSetting";
	const subscriptionModelName = "Subscription";
	var agenda = require('../../app').get('agenda');

	req.checkBody('payment_setting_id', 'Missing Query Param').notEmpty();
	req.checkBody('selected_billing_address_id', 'Missing Query Param').notEmpty();
	req.checkBody('selected_shipping_address_id', 'Missing Query Param').notEmpty();

	var errors = req.validationErrors();
	if (errors) {
		res.status(400).send('Missing Query Params');
		return;
	}

	try {
		const paymentSetting = await service.findOneRow(paymentSettingModelName, {
			id: req.body.payment_setting_id,
			user_id: req.user.id
		});

		if (paymentSetting) {
			const cartResult = await cartService.cartCalculation(req.user.id, req, res);

			for (var marketplace in cartResult.marketplace_products) {
				if (cartResult.marketplace_products.hasOwnProperty(marketplace)) {
					cartItems = await cartItems.concat(cartResult.marketplace_products[marketplace].products);
				}
			}

			var metadata = {};
			var description = "GTC ORDER";
			let amount = cartResult.grand_total_with_discounted_amount;
			let cardDetails = JSON.parse(paymentSetting.card_details);

			const charge = await stripe.chargeCustomerCard(req.user.stripe_customer_id, cardDetails.id, amount, description, config.order.currency, metadata);
			const newPayment = await service.createRow(paymentModelName, {
				date: new Date(charge.created),
				amount: charge.amount / 100.0,
				payment_method: paymentMethod['STRIPE'],
				status: status['ACTIVE'],
				payment_response: JSON.stringify(charge),
				created_by: req.user.first_name,
				created_on: new Date()
			});

			const newOrder = await service.createRow(orderModelName, {
				user_id: req.user.id,
				invoice_id: uuidv1(),
				purchase_order_id: "PO-" + uuidv1(),
				po_number: null,
				total_order_items: cartResult.total_items,
				total_price: newPayment.amount,
				ordered_date: new Date(),
				payment_id: newPayment.id,
				shipping_id: null,
				shipping_address_id: req.body.selected_shipping_address_id,
				billing_address_id: req.body.selected_billing_address_id,
				status: status['ACTIVE'],
				created_by: req.user.first_name,
				created_on: new Date()
			});

			for (let cartItem of cartItems) {
				var newProductItem = {};

				newProductItem['order_id'] = newOrder.id;
				newProductItem['product_id'] = cartItem.product_id;
				newProductItem['quantity'] = cartItem.quantity;
				newProductItem['price'] = cartItem.total_price;
				newProductItem['shipping_cost'] = 0;
				newProductItem['gtc_fees'] = (cartItem.total_price / 100 * parseFloat(config.order.gtc_fees)).toFixed(2);

				if (cartItem.Product.marketplace_id == marketPlaceCode['SERVICE']) {
					newProductItem['plan_fees'] = (cartItem.total_price / 100 * parseFloat(config.order.service_fee)).toFixed(2);
				} else if (cartItem.Product.marketplace_id == marketPlaceCode['LIFESTYLE']) {
					newProductItem['plan_fees'] = (cartItem.total_price / 100 * config.order.lifestyle_fee).toFixed(2);
				} else {
					newProductItem['plan_fees'] = 0;
				}

				newProductItem['is_coupon_applied'] = cartItem.is_coupon_applied ? 1 : 0;
				if (newProductItem['is_coupon_applied']) {
					newProductItem['coupon_id'] = cartResult.coupon_id;
					newProductItem['coupon_amount'] = parseFloat(cartResult.discount_amount);
				} else {
					newProductItem['coupon_amount'] = 0;
				}
				newProductItem['is_on_sale_item'] = 0;
				newProductItem['final_price'] = (parseFloat(newProductItem['price']) - (parseFloat(newProductItem['gtc_fees']) + parseFloat(newProductItem['plan_fees']) + parseFloat(newProductItem['coupon_amount'])));
				newProductItem['is_on_sale_item'] = cartItem.Product.is_exclusive_sale ? 1 : 0;
				if (newProductItem['is_on_sale_item']) {
					newProductItem['discount_amount'] = cartItem.Product.discount;
				}
				newProductItem['order_item_status'] = orderStatusNew['ORDER_INITIATED'];
				newProductItem['status'] = status['ACTIVE'];
				newProductItem['created_by'] = req.user.first_name;
				newProductItem['created_on'] = new Date();

				if (cartItem.Product.marketplace_id == marketPlaceCode['LIFESTYLE']) {
					var subscriptionItem = {};
					subscriptionItem['user_id'] = req.user.id;
					subscriptionItem['product_id'] = cartItem.product_id;
					subscriptionItem['quantity'] = cartItem.quantity;
					subscriptionItem['purchased_on'] = new Date();
					subscriptionItem['last_order_placed_on'] = new Date();
					subscriptionItem['status'] = status['ACTIVE'];
					subscriptionItem['created_by'] = req.user.first_name;
					subscriptionItem['created_on'] = new Date();
					if (cartItem.Product.subscription_duration_unit == durationCode['DAYS'])
						subscriptionItem['next_order_place_on'] = new Date().setDate(new Date().getDate() + cartItem.Product.subscription_duration);
					else
						subscriptionItem['next_order_place_on'] = new Date().setDate(new Date().getDate() + (cartItem.Product.subscription_duration * 30));

					await service.createRow(subscriptionModelName, subscriptionItem);
				}

				orderItemsPromises.push(service.createRow(orderItemModelName, newProductItem));

				const index = await vendorArray.findIndex((obj) => obj.vendor_id == cartItem.Product.vendor_id);
				if (index > -1) {
					vendorArray[index].total_price += parseFloat(newProductItem['price']);
					vendorArray[index].shipping_cost += parseFloat(newProductItem['shipping_cost']);
					vendorArray[index].gtc_fees += parseFloat(newProductItem['gtc_fees']);
					vendorArray[index].plan_fees += parseFloat(newProductItem['plan_fees']);
					vendorArray[index].coupon_amount += parseFloat(newProductItem['coupon_amount']);
					vendorArray[index].final_price += parseFloat(newProductItem['final_price']);
				} else {
					vendorArray.push({
						order_id: newOrder.id,
						vendor_id: cartItem.Product.vendor_id,
						total_price: parseFloat(newProductItem['price']),
						shipping_cost: parseFloat(newProductItem['shipping_cost']),
						gtc_fees: parseFloat(newProductItem['gtc_fees']),
						gtc_fees_percent: parseFloat(config.order.gtc_fees),
						plan_fees: parseFloat(newProductItem['plan_fees']),
						plan_fees_percent: parseFloat(config.order.service_fee),
						coupon_amount: parseFloat(newProductItem['coupon_amount']),
						final_price: parseFloat(newProductItem['final_price']),
						status: status['ACTIVE'],
						created_by: req.user.first_name,
						created_on: new Date()
					});
				}

				productQuantityPromises.push(model[productModelName].decrement({
					'quantity_available': cartItem.quantity
				}, {
						where: {
							id: cartItem.product_id
						}
					}));

				cartEmptyPromises.push(service.updateRecordNew(cartModelName, {
					status: status['DELETED'],
					last_updated_by: req.user.first_name,
					last_updated_on: new Date()
				}, {
						id: cartItem.id
					}));
			}
			await Promise.all(orderItemsPromises);
			await Promise.all(productQuantityPromises);
			await Promise.all(cartEmptyPromises);
			await Promise.all(vendorArray.map(async (vendorOrder) => {
				orderVendorPromises.push(service.createRow(orderVendorModelName, vendorOrder));
			}));

			agenda.now(config.jobs.orderNotification, {
				order: newOrder.id,
				code: config.notification.templates.vendorNewOrder
			});

			agenda.now(config.jobs.orderNotification, {
				order: newOrder.id,
				code: config.notification.templates.orderDetail
			});

			agenda.now(config.jobs.orderEmail, {
				order: newOrder.id
			});

			return res.status(200).send({
				order: newOrder.id
			});
		} else {
			return res.status(404).send("Payment card details not found");
		}
	} catch (error) {
		console.log("makePayment Error:::", error);
		return res.status(500).send(error);
	}
}

export function createCard(req, res) {
	let user = req.user;
	var paymentSetting,
		cardDetails;
	if (_.isUndefined(user.stripe_customer_id) || _.isNull(user.stripe_customer_id)) {
		stripe.createCustomer(user, req.body.token.id)
			.then(customer => {
				user.stripe_customer_id = customer.id;
				let card = customer.sources.data[0];
				return savePaymentSetting(user, card, req.body.isPrimary);
			}).then(paymentSettingRes => {
				paymentSetting = paymentSettingRes;
				return service.updateRow('User', user, user.id);
			}).then(result => {
				return res.status(200).send(paymentSetting);
			}).catch((error) => {
				console.log("createCustomer Error:::", error);
				return res.status(500).send(error);
			});
	} else {
		stripe.addCard(user.stripe_customer_id, req.body.token.id, req.body.isPrimary)
			.then(card => {
				cardDetails = card
				if (req.body.isPrimary) {
					return service.updateManyRecord('PaymentSetting', { is_primary: 0 }, {
						status: status["ACTIVE"],
						user_id: user.id,
					})
				}
			}).then(updateRow => {
				return savePaymentSetting(user, cardDetails, req.body.isPrimary);
			}).then(result => {
				paymentSetting = result;
				return res.status(200).send(paymentSetting);
			}).catch((error) => {
				console.log("addCard Error:::", error);
				return res.status(500).send(error);
			});
	}
}

function savePaymentSetting(user, card, isPrimary) {
	var isPrimary = isPrimary ? 1 : 0;
	let paymentSetting = {
		user_id: user.id,
		stripe_card_id: card.id,
		stripe_customer_id: user.stripe_customer_id,
		card_type: card.brand,
		status: status["ACTIVE"],
		is_primary: isPrimary,
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

export async function cancelOrderItem(req, res) {
	var agenda = require('../../app').get('agenda');
	req.checkBody('item_id', 'Missing Query Param').notEmpty();
	var errors = req.validationErrors();
	if (errors) {
		res.status(400).send('Missing Query Params');
		return;
	}

	let itemId = parseInt(req.body.item_id);

	let includeArray = [];
	let orderItemStatus;
	includeArray = populate.populateData("Product");
	let orderItemObj = {
		id: itemId
	};

	try {
		const itemObj = await service.findRow('OrderItem', orderItemObj, includeArray);
		if (itemObj) {
			if ((itemObj.order_item_status == ORDER_ITEM_NEW_STATUS['ORDER_INITIATED']) ||
				(itemObj.order_item_status == ORDER_ITEM_NEW_STATUS['CONFIRMED'])) {

				if (req.user.Vendor.id == itemObj.Product.vendor_id)
					orderItemStatus = ORDER_ITEM_NEW_STATUS['VENDOR_CANCELED'];
				else
					orderItemStatus = ORDER_ITEM_NEW_STATUS['CANCELED'];

				let updateOrderItem = {
					order_item_status: orderItemStatus,
					cancelled_on: new Date(),
					reason_for_cancel: req.body.reason_for_cancel,
					last_updated_by: req.user.first_name,
					last_updated_on: new Date()
				};
				const updatestatusRow = await service.updateRow('OrderItem', updateOrderItem, itemId);
				if (updatestatusRow) {
					let queryOrderVendor = {
						order_id: itemObj.order_id,
						vendor_id: itemObj.Product.vendor_id
					};

					const orderVendorObj = await service.findRow('OrderVendor', queryOrderVendor, []);

					if (orderVendorObj) {
						let orderVendorUpdateObj = {
							total_price: (parseFloat(orderVendorObj.total_price) - parseFloat(itemObj.price)).toFixed(2),
							shipping_cost: (parseFloat(orderVendorObj.shipping_cost) - parseFloat(itemObj.shipping_cost)).toFixed(2),
							gtc_fees: (parseFloat(orderVendorObj.gtc_fees) - parseFloat(itemObj.gtc_fees)).toFixed(2),
							plan_fees: (parseFloat(orderVendorObj.plan_fees) - parseFloat(itemObj.plan_fees)).toFixed(2),
							final_price: (parseFloat(orderVendorObj.final_price) - parseFloat(itemObj.final_price)).toFixed(2),
							coupon_amount: (parseFloat(orderVendorObj.coupon_amount) - parseFloat(itemObj.coupon_amount)).toFixed(2),
							last_updated_by: req.user.first_name,
							last_updated_on: new Date()
						};

						const updateStatus = await service.updateRow('OrderVendor', orderVendorUpdateObj, orderVendorObj.id);
						if (updateStatus) {
							agenda.now(config.jobs.orderNotification, {
								itemId: itemId,
								code: config.notification.templates.orderItemCancelled,
							});
							return res.status(200).send(resMessage("SUCCESS", "Order Cancelled and Refund Initiated. Credited to bank account to 5 to 7 bussiness days"));
						} else {
							return res.status(400).send("Order vendor update failed.");
						}
					} else {
						return res.status(404).send("Order vendor not found.");
					}
				} else {
					return res.status(400).send("Orderitem update failed.");
				}
			} else {
				return res.status(400).send("Orderitem out for shipping.");
			}
		} else {
			return res.status(404).send("Orderitem not found.");
		}
	} catch (error) {
		console.log('cancel Item Error:::', error);
		return res.status(500).send(error);
	}
}

export async function returnOrderItem(req, res) {
	var agenda = require('../../app').get('agenda');
	req.checkBody('return_item_id', 'Missing Query Param').notEmpty();
	var errors = req.validationErrors();
	if (errors) {
		res.status(400).send('Missing Query Params');
		return;
	}

	let itemId = parseInt(req.body.return_item_id);

	let includeArray = [];
	includeArray = populate.populateData("Product");
	let orderItemObj = {
		id: itemId
	};
	try {
		const itemObj = await service.findRow('OrderItem', orderItemObj, includeArray);
		if (itemObj) {
			if ((itemObj.order_item_status == ORDER_ITEM_NEW_STATUS['DELIVERED']) && checkingDays(itemObj.delivered_on)) {
				let updateOrderItem = {
					order_item_status: ORDER_ITEM_NEW_STATUS['REQUEST_FOR_RETURN'],
					request_for_return_on: new Date(),
					reason_for_return: req.body.reason_for_return,
					last_updated_by: req.user.first_name,
					last_updated_on: new Date()
				};
				const updatestatusRow = await service.updateRow('OrderItem', updateOrderItem, itemId);
				if (updatestatusRow) {
					let queryOrderVendor = {
						order_id: itemObj.order_id,
						vendor_id: itemObj.Product.vendor_id
					};

					const orderVendorObj = await service.findRow('OrderVendor', queryOrderVendor, []);

					if (orderVendorObj) {
						let orderVendorUpdateObj = {
							total_price: (parseFloat(orderVendorObj.total_price) - parseFloat(itemObj.price)).toFixed(2),
							shipping_cost: (parseFloat(orderVendorObj.shipping_cost) - parseFloat(itemObj.shipping_cost)).toFixed(2),
							gtc_fees: (parseFloat(orderVendorObj.gtc_fees) - parseFloat(itemObj.gtc_fees)).toFixed(2),
							plan_fees: (parseFloat(orderVendorObj.plan_fees) - parseFloat(itemObj.plan_fees)).toFixed(2),
							final_price: (parseFloat(orderVendorObj.final_price) - parseFloat(itemObj.final_price)).toFixed(2),
							coupon_amount: (parseFloat(orderVendorObj.coupon_amount) - parseFloat(itemObj.coupon_amount)).toFixed(2),
							last_updated_by: req.user.first_name,
							last_updated_on: new Date()
						};

						const updateStatus = await service.updateRow('OrderVendor', orderVendorUpdateObj, orderVendorObj.id);
						if (updateStatus) {
							agenda.now(config.jobs.orderNotification, {
								itemId: itemId,
								code: config.notification.templates.refundRequest,
							});
							return res.status(200).send(resMessage("SUCCESS", "Order Return Initiated. Credited to bank account to 5 to 7 bussiness days"));
						} else {
							return res.status(400).send("Order vendor update failed.");
						}
					} else {
						return res.status(404).send("Order vendor not found.");
					}

				} else {
					return res.status(400).send("Orderitem update failed.");
				}
			} else {
				return res.status(400).send("Orderitem return days excedded.");
			}
		} else {
			return res.status(404).send("Orderitem not found.");
		}
	} catch (error) {
		console.log('Return item Error:::', error);
		return res.status(500).send(error);
	}
}

function checkingDays(date) {
	const deliveredDate = new Date(date);
	const currentDate = new Date();
	deliveredDate.setDate(deliveredDate.getDate() + parseInt(config.returnItemDays));
	if (deliveredDate >= currentDate) {
		return true;
	} else {
		return false;
	}
}

export async function confirmOrderItem(req, res) {
	var agenda = require('../../app').get('agenda');
	req.checkBody('item_id', 'Missing Query Param').notEmpty();
	var errors = req.validationErrors();
	if (errors) {
		res.status(400).send('Missing Query Params');
		return;
	}

	let itemId = parseInt(req.body.item_id);

	let includeArray = [];
	let orderItemObj = {
		id: itemId
	};

	try {
		const itemObj = await service.findRow('OrderItem', orderItemObj, includeArray);
		if (itemObj) {
			if (itemObj.order_item_status == ORDER_ITEM_NEW_STATUS['ORDER_INITIATED']) {
				let updateOrderItem = {
					order_item_status: ORDER_ITEM_NEW_STATUS['CONFIRMED'],
					item_confirmed_on: new Date(),
					last_updated_by: req.user.first_name,
					last_updated_on: new Date()
				};
				const updatestatusRow = await service.updateRow('OrderItem', updateOrderItem, itemId);
				if (updatestatusRow) {
					agenda.now(config.jobs.orderNotification, {
						itemId: itemId,
						code: config.notification.templates.orderStatus,
					});
					return res.status(200).send(resMessage("SUCCESS", "Order item confirmed successfully"));
				} else {
					return res.status(400).send("Orderitem update failed.");
				}
			} else {
				return res.status(400).send("Orderitem is already forword.");
			}
		} else {
			return res.status(404).send("Orderitem not found.");
		}
	} catch (error) {
		console.log('confirm order Error:::', error);
		return res.status(500).send(error);
	}
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

export function sendOrderMail(orderIdStore, req) {
	var user = {};
	user = req.user;
	var orderIdStore = orderIdStore;
	var includeArr = [{
		model: model['OrderItem'],
		include: [{
			model: model['Product'],
			include: [{
				"model": model['Vendor'],
				attributes: ['id', 'vendor_name'],
				include: [{
					model: model['User'],
					attributes: ['id', 'email', 'user_contact_email', 'email_verified'],
				}]
			}, {
				model: model['ProductMedia'],
				attributes: ['url']
			}],
		}]
	}, {
		model: model['Address'],
		as: 'shippingAddress',
		include: [{
			model: model['State']
		}, {
			model: model['Country']
		},]
	}]
	console.log(orderIdStore);
	var queryObj = {
		id: orderIdStore
	}
	var field = 'created_on';
	var order = "asc";
	var orderItemMail = service.findAllRows('Order', includeArr, queryObj, 0, null, field, order).then(function(OrderList) {
		if (OrderList) {
			usernotification(OrderList, user);
			vendorMail(OrderList, user);
			if (user.user_contact_email) {
				var agenda = require('../../app').get('agenda');
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
							var total = 0;
							body = response.body.replace('%ORDER_TYPE%', 'Order Status');
							body = body.replace(/%Path%/g, config.baseUrl); // req.protocol + '://' + req.get('host'));
							body = body.replace(/%currency%/g, '$');
							body = body.replace('%UserName%', user.first_name);
							body = body.replace(/%URL%/g, config.baseUrl);
							_.forOwn(OrderList.rows, function(orders) {
								_.forOwn(orders.OrderItems, function(orderEle) {
									orderEle.final_price = numeral(orderEle.final_price).format('$' + '0,0.00');
									orders.total_price = numeral(orders.total_price).format('$' + '0,0.00');
								})
								body = body.replace('%placed_on%', moment(orders.created_on).format('MMM D, Y'));

								total = total + orders.total_price;
								orderNew.push(orders);
							});

							var template = Handlebars.compile(body);
							var data = {
								order: orderNew
							};
							var result = template(data);
							var mailArray = [];
							mailArray.push({
								to: email,
								subject: subject,
								html: result
							});
							agenda.now(config.jobs.email, {
								mailArray: mailArray
							});
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
	var agenda = require('../../app').get('agenda');
	var queryObjEmailTemplate = {};
	var emailTemplateModel = 'EmailTemplate';
	queryObjEmailTemplate['name'] = config.email.templates.vendorNewOrder;
	service.findOneRow(emailTemplateModel, queryObjEmailTemplate)
		.then(function(response) {
			if (order.OrderItems[0].Product.Vendor.User.user_contact_email) {
				var orderNew = [];
				var email = order.OrderItems[0].Product.Vendor.User.user_contact_email;
				var subject = response.subject.replace('%ORDER_TYPE%', 'New Order');
				var body;
				body = response.body.replace('%ORDER_TYPE%', 'New Order');
				body = body.replace(/%currency%/g, '$');
				body = body.replace(/%Path%/g, config.baseUrl); //req.protocol + '://' + req.get('host'));
				body = body.replace('%VendorName%', order.OrderItems[0].Product.Vendor.vendor_name);
				_.forOwn(order.OrderItems, function(orders) {
					body = body.replace('%placed_on%', moment(new Date()).format('MMM D, Y'));
					body = body.replace('%Total_Price%', numeral(order.total_price).format('$' + '0,0.00'))
					orders.final_price = numeral(orders.final_price).format('0,0.00');
					orderNew.push(orders);
				});
				var template = Handlebars.compile(body);
				var data = {
					order: order
				};

				var result = template(data);
				var mailArray = [];
				mailArray.push({
					to: email,
					subject: subject,
					html: result
				});
				agenda.now(config.jobs.email, {
					mailArray: mailArray
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
			return;
		});
	return;
}

function usernotification(order, user) {
	var queryObjNotification = {};
	var NotificationTemplateModel = 'NotificationSetting';
	queryObjNotification['code'] = config.notification.templates.orderDetail;
	var orderEle = '';
	service.findOneRow(NotificationTemplateModel, queryObjNotification)
		.then(function(response) {
			var bodyParams = {};
			_.forOwn(order.rows, function(orders) {
				if (orderEle.length > 0) {
					orderEle = `, <a href="` + config.baseUrl + `/order-history/"` + orders.id + `>#` + orders.id + `</a>`;
				}
				orderEle = `<a href="` + config.baseUrl + `/order-history/"` + orders.id + `>#` + orders.id + `</a>`;
			});
			bodyParams.user_id = user.id;
			bodyParams.description = response.description
			bodyParams.description = bodyParams.description.replace('%Firstname%', user.first_name);
			// bodyParams.description = bodyParams.description.replace('%LastName%', user.last_name);
			bodyParams.description = bodyParams.description.replace('%orderEle%', orderEle);
			bodyParams.description = bodyParams.description.replace('%url%', orderEle);
			bodyParams.name = response.name;
			bodyParams.code = response.code;
			bodyParams.is_read = 1;
			bodyParams.status = 1;
			bodyParams.created_on = new Date();
			service.createRow("Notification", bodyParams);
			return;
		});
	return;
}

// PLAN PAYMENT

export function makePlanPayment(req, res) {
	var upgradingPlan, desc, convertMoment, start_date, end_date, vendorId;
	var paymentBodyParam = {},
		vendorPlanBodyParam = {},
		userPlanBodyParam = {},
		refundObj = {};

	vendorId = req.body.vendor_id;
	upgradingPlan = req.body.plan_id;
	desc = "GTC Plan Payment";
	convertMoment = moment();
	start_date = new Date(convertMoment);
	end_date = moment().add(30, 'd').toDate();

	stripe.chargeCustomerCard(req.body.stripe_customer_id, req.body.carddetailsid, req.body.amount, desc, CURRENCY)
		.then(function(paymentResponse) {
			if (paymentResponse.paid) {
				paymentBodyParam = {
					date: new Date(paymentResponse.created),
					amount: paymentResponse.amount / 100.0,
					payment_method: paymentMethod['STRIPE'],
					status: status['ACTIVE'],
					payment_response: JSON.stringify(paymentResponse),
					created_by: req.user.first_name,
					created_on: new Date()

				};
				return service.createRow('Payment', paymentBodyParam);
			} else {
				return res.status(200).send({
					"message": "ERROR",
					"messageDetails": "Plan upgrade UnSuccessfull with Stripe Payment Error. Please try after sometimes"
				});
			}
		}).then(function(paymentRow) {
			if ((vendorId != 0 && upgradingPlan != 5)) {
				vendorPlanBodyParam = {
					vendor_id: vendorId,
					plan_id: req.body.plan_id,
					payment_id: paymentRow.id,
					status: status['ACTIVE'],
					auto_renewal: req.body.autoRenewalMail,
					start_date: start_date,
					end_date: end_date,
					created_by: req.user.first_name,
					created_on: new Date()
				}
				if (req.user.user_contact_email) {
					sendUpgrademail(req.body.plan_id, req.user);
				}
				service.createRow('VendorPlan', vendorPlanBodyParam).then(function(currentplanrow) {
					let includeArr = [];
					refundObj = {
						vendor_id: vendorId,
						status: status['ACTIVE'],
						id: {
							$ne: currentplanrow.id
						},
					};
					var field = 'created_on';
					var order = "asc";
					service.findAllRows('VendorPlan', includeArr, refundObj, 0, null, field, order).then(function(successPromise) {
						if (successPromise.count != "0") {
							let plandeactivestatus = {
								status: status['INACTIVE'],
								last_updated_by: req.user.first_name,
								last_updated_on: new Date()
							};
							refundObj = {
								vendor_id: vendorId,
								id: {
									$ne: currentplanrow.id
								},
							};
							return service.updateManyRecord('VendorPlan', plandeactivestatus, refundObj);
						}
					});
				});
			} else {
				if (req.user.user_contact_email) {
					sendUpgrademail(req.body.plan_id, req.user);
				}
				userPlanBodyParam = {
					user_id: req.body.user_id,
					plan_id: req.body.plan_id,
					payment_id: paymentRow.id,
					auto_renewal: req.body.autoRenewalMail,
					status: status['ACTIVE'],
					start_date: start_date,
					end_date: end_date,
					created_by: req.user.first_name,
					created_on: new Date()
				};
				return service.createRow('UserPlan', userPlanBodyParam);
			}
		}).then(function(updatedPlanRow) {
			if (vendorId != 0) {
				var productDeactivateQueryObj = {},
					productDeactivateBodyParam = {};

				productDeactivateQueryObj = {
					vendor_id: vendorId,
					status: status["ACTIVE"]
				}
				productDeactivateBodyParam = {
					status: status["GTC_INACTIVE"],
					last_updated_by: req.user.first_name,
					last_updated_on: new Date()
				}
				return service.updateRecordNew('Product', productDeactivateBodyParam, productDeactivateQueryObj);
			}
		}).then(function(deactivatedProducts) {
			if (vendorId != 0) {

				var productActivateQueryObj = {},
					productActivateBodyParam = {};

				productActivateQueryObj.vendor_id = vendorId;
				productActivateQueryObj.status = status["GTC_INACTIVE"];

				if (upgradingPlan == gtcPlan.LIFESTYLE_PROVIDER)
					productActivateQueryObj.marketplace_id = marketPlaceCode["LIFESTYLE"];

				if (upgradingPlan == gtcPlan.SERVICE_PROVIDER)
					productActivateQueryObj.marketplace_id = marketPlaceCode["SERVICE"];

				if (upgradingPlan == gtcPlan.PUBLIC_SELLER) {
					productActivateQueryObj = {
						'$or': [{
							marketplace_id: marketPlaceCode["LIFESTYLE"]
						}, {
							marketplace_id: marketPlaceCode["SERVICE"]
						}, {
							marketplace_id: marketPlaceCode["PUBLIC"]
						}],
					};
				}
				productActivateBodyParam = {
					status: status["ACTIVE"],
					last_updated_by: req.user.first_name,
					last_updated_on: new Date()
				}
				return service.updateRecordNew('Product', productActivateBodyParam, productActivateQueryObj);
			}
		}).then(function(activatedProductRow) {
			return res.status(200).send({
				"message": "Success",
				"messageDetails": "	Plan upgraded successfully."
			});
		}).catch(function(error) {
			return res.status(500).send({
				"message": "ERROR",
				"messageDetails": "Plan upgrade UnSuccessfull with Stripe Payment Error. Please try after sometimes.",
				"errorDescription": error
			});
		})
}

//PLAN UPGRADE WITHOUT PAYMENT

export function planUpgradeWithoutPayment(req, res) {

	var upgradingPlan, convertMoment, start_date, end_date, vendorId;
	var vendorPlanBodyParam = {},
		refundObj = {};

	vendorId = req.body.vendor_id;
	upgradingPlan = req.body.plan_id;
	convertMoment = moment();
	start_date = new Date(convertMoment);
	end_date = moment().add(30, 'd').toDate();

	vendorPlanBodyParam = {
		vendor_id: vendorId,
		plan_id: req.body.plan_id,
		status: status['ACTIVE'],
		auto_renewal: req.body.autoRenewalMail,
		start_date: start_date,
		end_date: end_date,
		created_by: req.user.first_name,
		created_on: new Date()
	}
	if (req.user.user_contact_email) {
		sendUpgrademail(req.body.plan_id, req.user);
	}
	service.createRow('VendorPlan', vendorPlanBodyParam).then(function(currentplanrow) {
		let includeArr = [];
		refundObj = {
			vendor_id: vendorId,
			status: status['ACTIVE'],
			id: {
				$ne: currentplanrow.id
			},
		};
		var field = 'created_on';
		var order = "asc";
		service.findAllRows('VendorPlan', includeArr, refundObj, 0, null, field, order).then(function(successPromise) {
			if (successPromise.count != "0") {
				let plandeactivestatus = {
					status: status['INACTIVE'],
					last_updated_by: req.user.first_name,
					last_updated_on: new Date()
				};
				refundObj = {
					vendor_id: vendorId,
					id: {
						$ne: currentplanrow.id
					},
				};
				return service.updateManyRecord('VendorPlan', plandeactivestatus, refundObj);
			}
		})
	}).then(function(updatedPlanRow) {
		var productDeactivateQueryObj = {},
			productDeactivateBodyParam = {};

		productDeactivateQueryObj = {
			vendor_id: vendorId,
			status: status["ACTIVE"]
		}
		productDeactivateBodyParam = {
			status: status["GTC_INACTIVE"],
			last_updated_by: req.user.first_name,
			last_updated_on: new Date()
		}
		return service.updateRecordNew('Product', productDeactivateBodyParam, productDeactivateQueryObj);

	}).then(function(deactivatedProducts) {

		var productActivateQueryObj = {},
			productActivateBodyParam = {};

		productActivateQueryObj.vendor_id = vendorId;
		productActivateQueryObj.status = status["GTC_INACTIVE"];

		if (upgradingPlan == gtcPlan.LIFESTYLE_PROVIDER)
			productActivateQueryObj.marketplace_id = marketPlaceCode["LIFESTYLE"];

		if (upgradingPlan == gtcPlan.SERVICE_PROVIDER)
			productActivateQueryObj.marketplace_id = marketPlaceCode["SERVICE"];

		if (upgradingPlan == gtcPlan.PUBLIC_SELLER) {
			productActivateQueryObj = {
				'$or': [{
					marketplace_id: marketPlaceCode["LIFESTYLE"]
				}, {
					marketplace_id: marketPlaceCode["SERVICE"]
				}, {
					marketplace_id: marketPlaceCode["PUBLIC"]
				}],
			};
		}
		productActivateBodyParam = {
			status: status["ACTIVE"],
			last_updated_by: req.user.first_name,
			last_updated_on: new Date()
		}
		return service.updateRecordNew('Product', productActivateBodyParam, productActivateQueryObj);

	}).then(function(activatedProductRow) {
		return res.status(200).send({
			"message": "Success",
			"messageDetails": "	Plan upgraded successfully."
		});
	}).catch(function(error) {
		return res.status(500).send({
			"message": "ERROR",
			"messageDetails": "Plan upgrade UnSuccessfull with Stripe Payment Error. Please try after sometimes.",
			"errorDescription": error
		});
	})
}

//plan upgrade email starts//
function sendUpgrademail(plan_id, user) {
	var includeArray = [];
	let upgradePlanModel = {
		id: plan_id
	}
	var agenda = require('../../app').get('agenda');
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
					body = body.replace('%FIRST_NAME%', user.first_name);
					body = body.replace('%PLAN_NAME%', upgradeplanobj.name);
					body = body.replace('%PLAN_COST%', '$ '+numeral(upgradeplanobj.cost).format('0,0.00'));
					var mailArray = [];
					mailArray.push({
						to: email,
						subject: subject,
						html: body
					});
					agenda.now(config.jobs.email, {
						mailArray: mailArray
					});
					return;
				}).catch(function(error) {
					console.log('Error :::', error);
					return;
				})
		})
}

export function refundOrder(req, res) {

	var userdetails = req.user;

	var refundOrderitemsID = [];
	var notification = [];
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
				date: new Date(refundRow.created),
				amount: refundRow.amount / 100.0,
				payment_method: paymentMethod['STRIPE'],
				status: status['ACTIVE'],
				payment_response: JSON.stringify(refundRow),
				created_by: req.user.first_name,
				created_on: new Date()
			};
			return service.createRow('Payment', paymentModel);
		})
		.then(createdPaymentRow => {
			console.log("enterrrlooops" + parseFloat(createdPaymentRow.amount).toFixed(2));
			var refundamt = parseFloat(createdPaymentRow.amount).toFixed(2);
			if (req.user.user_contact_email) {
				sendRefundOrderMail(refundOrderitemsID, req.user, refundamt);
				notification.push(refundNotifications(refundOrderitemsID, req.user, refundamt));
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
	var includeArr = populate.populateData('Product,Product.ProductMedia,Product.Vendor,Product.Vendor.User,Order');
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
			var agenda = require('../../app').get('agenda');

			service.findOneRow(emailTemplateModel, queryObjEmailTemplate)
				.then(function(response) {
					var email = vendor_email;
					var subject = response.subject.replace('%ORDER_TYPE%', 'Refund Order');
					var body;
					var body = response.body;
					body = body.replace('%VENDOR_NAME%', user.first_name);
					body = body.replace('%refundamount%', refundamount);
					_.forOwn(orderRefundList, function(orders) {
						body = body.replace('%ORDER_NUMBER%', orders.Order.id);
						body = body.replace('%placed_on%', moment(new Date()).format('MMM D, Y'));
						orders.final_price = numeral(orders.final_price).format('$' + '0,0.00');
						orderNew.push(orders);
					});
					var template = Handlebars.compile(body);
					var data = {
						order: orderNew
					};
					var result = template(data);
					var mailArray = [];
					mailArray.push({
						to: email,
						subject: subject,
						html: result
					});
					agenda.now(config.jobs.email, {
						mailArray: mailArray
					});
				}).catch(function(error) {
					console.log('Error :::', error);
					return;
				})
		}
	})
}

function refundNotifications(refundOrderitemsID, user) {
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
			queryObjNotification['code'] = config.notification.templates.refundProcessing;
			service.findOneRow(NotificationTemplateModel, queryObjNotification)
				.then(function(response) {
					var bodyParams = {};
					bodyParams.user_id = user.id;
					var description = response.description;
					description = description.replace('%FirstName%', user.first_name);
					description = description.replace('%LastName%', user.last_name);
					_.forOwn(orderRefundList, function(orders) {
						description = description.replace('%OrderId%', orders.Order.id);
						description = description.replace('%path%', '/my-order/order/' + orders.Order.id);
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