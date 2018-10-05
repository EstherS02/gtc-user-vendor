const sequelize = require('sequelize');
const model = require('../../sqldb/model-connect');
const config = require('../../config/environment');
const statusCode = require('../../config/status');
const service = require('../service');
const moment = require('moment');
const _ = require('lodash');
const stripe = require('../../payment/stripe.payment');
const sendEmail = require('../../agenda/send-email');
const durationCode = require('../../config/duration-unit');
const orderStatusCode = require('../../config/order_status');
const paymentMethod = require('../../config/payment-method');
const orderPaymentType = require('../../config/order-payment-type');
const uuidv1 = require('uuid/v1');
const numeral = require('numeral');

const CURRENCY = 'usd';
const current_date = new Date();

export function subscription(req, res) {

	console.log('********************JOBS CALLED');
	console.log('agenda for subscription orders..');

	var offset, limit, field, order;
	var subscriptionQueryObj = {}, subscriptionIncludeArr = [];

	offset = null;
	limit = null;
	field = 'id';
	order = 'asc';

	subscriptionQueryObj['status'] = statusCode['ACTIVE'];

	subscriptionIncludeArr = [
		{
			"model": model['Product'],
			where: {
				status: statusCode["ACTIVE"]
			},
			include: [ {
				"model": model['ProductMedia'],
				where: {
					status: statusCode["ACTIVE"],
					base_image: 1
				},
				attributes:['id', 'url']
			}],
			attributes: ['id','product_name', 'price', 'subscription_duration', 'subscription_duration_unit', 'shipping_cost'],
		},
		{
			"model": model['User'],
			where: {
				status: statusCode["ACTIVE"]
			},
			attributes: ['id', 'first_name', 'user_contact_email'],
		}
	]

	service.findAllRows('Subscription', subscriptionIncludeArr, subscriptionQueryObj, offset, limit, field, order)
		.then(function(subscriptionRows) {

			var subscriptionPromises = [];
			_.forOwn(subscriptionRows.rows, function(eachSubscription) {

				subscriptionPromises.push(subscriptionOrder(eachSubscription));
			});
			return Promise.all(subscriptionPromises);
		}).then(function(result){
			console.log("result",result)
			return res.status(200).send(result);

		}).catch(function(error) {
			return res.status(500).send(error);
		});
}

function subscriptionOrder(eachSubscription) {

	var subscribedProduct, subscriptionDuration, latestSubscriptionPlacedOn, subscriptionRenewOn, subscriptionTotalAmount, shippingTotal, finalPrice;
	var subscriptionOrderQueryObj = {}, subscriptionCardDetails = {}, createdSubscription = {}, subscriptionOrderIncludeArr = [];

	subscribedProduct = eachSubscription.Product;
	subscriptionOrderQueryObj = {
		user_id: eachSubscription.user_id,
		//order_status: orderStatusCode['DELIVEREDORDER'],
		status: statusCode["ACTIVE"]
	}

	subscriptionOrderIncludeArr = [
		{
			"model": model['OrderItem'],
			where: {
				status: statusCode['ACTIVE'],
				product_id: subscribedProduct.id
			},
			attributes: ['id'],
		}
	]

	if (subscribedProduct.subscription_duration_unit == durationCode['MONTHS']) {
		subscriptionDuration = subscribedProduct.subscription_duration * 30;
	} else if (subscribedProduct.subscription_duration_unit == durationCode['DAYS']) {
		subscriptionDuration = subscribedProduct.subscription_duration;
	}
	
	model['Order'].findOne({
		where: subscriptionOrderQueryObj,
		order: [ [ 'created_on', 'DESC' ]],
		include: subscriptionOrderIncludeArr,
		}).then(function(latestSubscriptionOrder) {

			latestSubscriptionPlacedOn = latestSubscriptionOrder.ordered_date;
			subscriptionRenewOn = moment(latestSubscriptionPlacedOn, "YYYY-MM-DD").add(+subscriptionDuration, 'd');

			if (subscriptionRenewOn < current_date) {

				var paymentSettingModel = 'PaymentSetting';
				var cardQueryObj = {};

				cardQueryObj['status'] = statusCode['ACTIVE'];
				cardQueryObj['is_primary'] = 1;
				cardQueryObj['user_id'] = eachSubscription.user_id;

				return service.findRow(paymentSettingModel, cardQueryObj, [])
					.then(function(cardDetails) {

						subscriptionCardDetails = cardDetails;

						subscriptionTotalAmount = subscribedProduct.price * eachSubscription.quantity;
						shippingTotal = eachSubscription.quantity * subscribedProduct.shipping_cost;
						finalPrice = shippingTotal + subscriptionTotalAmount;

						var orderBodyParam = {};

						orderBodyParam['user_id'] = eachSubscription.user_id;
						orderBodyParam['invoice_id'] = uuidv1();
						orderBodyParam['purchase_order_id'] = 'PO-' + uuidv1();
						orderBodyParam['ordered_date'] = current_date;
						orderBodyParam['status'] = statusCode['ACTIVE'];
						orderBodyParam['total_price'] = finalPrice;
						orderBodyParam['gtc_fees'] = subscriptionTotalAmount * .01;
						orderBodyParam['plan_fees'] = subscriptionTotalAmount * .1;
						orderBodyParam['shipping_address_id'] = latestSubscriptionOrder.shipping_address_id;
						orderBodyParam['billing_address_id'] = latestSubscriptionOrder.billing_address_id;
						orderBodyParam['order_status'] = orderStatusCode['NEWORDER'];
						orderBodyParam['vendor_pay'] = 1;
						orderBodyParam['vendor_pay'] = 100;
						orderBodyParam['created_by'] = eachSubscription.User.first_name;
						orderBodyParam['created_on'] = current_date;

						return service.createRow('Order', orderBodyParam);

					}).then(function(createdSubscriptionOrder) {

						var orderItemBodyParam = {};

						createdSubscription = createdSubscriptionOrder;

						orderItemBodyParam['order_id'] = createdSubscriptionOrder.id;
						orderItemBodyParam['product_id'] = subscribedProduct.id;
						orderItemBodyParam['quantity'] = eachSubscription.quantity;
						orderItemBodyParam['shipping_total'] = shippingTotal;
						orderItemBodyParam['subtotal'] = subscriptionTotalAmount;
						orderItemBodyParam['final_price'] = finalPrice;
						orderItemBodyParam['status'] = statusCode['ACTIVE'];
						orderItemBodyParam['created_by'] = eachSubscription.User.first_name;
						orderItemBodyParam['created_on'] = current_date;

						return service.createRow('OrderItem', orderItemBodyParam);

					}).then(function(subscriptionOrderItemRow) {

						var desc = 'Subscription Auto Renewal Order';

						return stripe.chargeCustomerCard(subscriptionCardDetails.stripe_customer_id, subscriptionCardDetails.stripe_card_id, subscriptionTotalAmount, desc, CURRENCY);

					}).then(charge => {

						var paymentModelObj = {
							date: new Date(charge.created),
							amount: charge.amount / 100.0,
							payment_method: paymentMethod['STRIPE'],
							status: statusCode['ACTIVE'],
							payment_response: JSON.stringify(charge)
						};

						return service.createRow('Payment', paymentModelObj);
					}).then(function(paymentRow) {

						var orderPaymentObj = {
							order_id: createdSubscription.id,
							payment_id: paymentRow.id,
							order_payment_type: orderPaymentType['ORDER_PAYMENT'],
							status: statusCode['ACTIVE'],
							created_on: new Date(),
							created_by: eachSubscription.User.first_name
						};

						return service.createRow('OrderPayment', orderPaymentObj);
					}).then(function(orderPaymentRow) {

						var orderStatusUpdateObj = {}
						orderStatusUpdateObj['order_status'] = orderStatusCode['NEWORDER'];

						return service.updateRow('Order', orderStatusUpdateObj, createdSubscription.id);
					}).then(function(updatedOrderRow) {

						subscriptionOrderMail(createdSubscription, eachSubscription);
						return service.findIdRow('Product', subscribedProduct.id);

					}).then(function(product){

						let quantityUpdate = {};
						let currentQuantity = product.quantity_available - 1;
						quantityUpdate.quantity_available = currentQuantity;

						if (currentQuantity == 0) {
							quantityUpdate.status = statusCode['SOLDOUT'];
						}

						return service.updateRow('Product', quantityUpdate, product.id);
					
					}).then(function(upadtedProductRow){

						var nextSubscriptionRenewOn = moment(current_date, "YYYY-MM-DD").add(+subscriptionDuration, 'd');

						let subscriptionUpdate = {};
						subscriptionUpdate.last_order_placed_on = current_date;
						subscriptionUpdate.next_order_place_on = nextSubscriptionRenewOn;
						subscriptionUpdate.last_updated_by = eachSubscription.User.first_name;
						subscriptionUpdate.last_updated_on = current_date;

						return service.updateRow('Subscription', subscriptionUpdate, eachSubscription.id);

					}).then(function(updatedSubscriptionRow){

						console.log("updatedSubscriptionRow",updatedSubscriptionRow);
						return Promise.resolve(updatedSubscriptionRow);
						
					}).catch(function(error) {
						console.log("Error::", error);

						var orderStatusUpdateObj = {}
						orderStatusUpdateObj['order_status'] = orderStatusCode['FAILEDORDER'];

						return service.updateRow('Order', orderStatusUpdateObj)
							.then(function(updatedRow){
								console.log("updatedRow",updatedRow);
								return Promise.reject(error);
							}).catch(function(err){
								console.log("updatedRow",updatedRow);
								return Promise.reject(error);
							})
					});
			} else {
				return;
			}
		}).catch(function(error) {
			console.log("Error::", error);
			return Promise.reject(error);
		});
}


function subscriptionOrderMail(createdSubscription,eachSubscription) {

	var emailTemplateQueryObj = {};
    emailTemplateQueryObj['name'] = config.email.templates.subscriptionAutoRenewalOrder;

	return service.findOneRow('EmailTemplate', emailTemplateQueryObj)
		.then(function (response) {
			if (response) {
				var email = eachSubscription.User.user_contact_email;
				
                var subject = response.subject;
                var body;
				body = response.body.replace('%USER_NAME%', eachSubscription.User.first_name);
				body = body.replace(/%PRODUCT_NAME%/g, eachSubscription.Product.product_name);
				body = body.replace('%ORDER_ID%', createdSubscription.id);
				body = body.replace('%QUANTITY%', eachSubscription.quantity);
				body = body.replace(/%CURRENCY%/g,'$');
				body = body.replace('%PRODUCT_PRICE%', eachSubscription.Product.price);
				body = body.replace('%TOTAL_PRICE%',numeral(createdSubscription.total_price).format('0,0.00'));
				body = body.replace('%PLACED_ON%',moment(createdSubscription.ordered_date).format('MMM D, Y'));
				body = body.replace('%IMAGE_URL%',  eachSubscription.Product.ProductMedia[0].url);
					
				sendEmail({
                    to: email,
                    subject: subject,
                    html: body
				});
				
                return;
			}else{
				return;
			}
		}).catch(function(error){
			return;
		})
}

