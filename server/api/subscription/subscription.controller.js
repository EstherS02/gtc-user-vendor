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
const uuidv1 = require('uuid/v1');

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
			attributes: ['id','price','subscription_duration','subscription_duration_unit','shipping_cost'],		
		},
		{
			"model": model['User'],
			where: {
                status: statusCode["ACTIVE"]
				},
			attributes: ['id','first_name'],

		}
	]
	
	service.findAllRows('Subscription', subscriptionIncludeArr, subscriptionQueryObj, offset, limit, field, order)
		.then(function(subscriptionRows){

			var subscriptionPromises = [];
			_.forOwn(subscriptionRows.rows, function (eachSubscription) {

				subscriptionPromises.push(subscriptionOrder(eachSubscription));
			});
			Promise.all(promises).then(function(subscriptionResult) {
				return res.status(200).send(subscriptionResult);
			}).catch(function(error){
				return res.status(500).send(err);
			})
			
		}).catch(function(error){
			return res.status(500).send(error);
		});
}

function subscriptionOrder(eachSubscription){

	var subscribedProduct, subscriptionDuration, latestSubscriptionPlacedOn, subscriptionRenewOn, subscriptionTotalAmount;
	var subscriptionOrderQueryObj = {}, subscriptionCardDetails = {}, subscriptionOrderIncludeArr = [];

	subscribedProduct = eachSubscription.Product;
	subscriptionOrderQueryObj ={
		user_id: eachSubscription.user_id
	}

	subscriptionOrderIncludeArr = [
		{
			"model": model['OrderItem'],
			where:{
				status: statusCode['ACTIVE'],	
				product_id: subscribedProduct.id		
			},
			attributes: ['id'],
		}		
	]

	if(subscribedProduct.subscription_duration_unit ==  durationCode['MONTHS']){
		subscriptionDuration = subscribedProduct.subscription_duration * 30;
	}else if(subscribedProduct.subscription_duration_unit ==  durationCode['DAYS']){
		subscriptionDuration =subscribedProduct.subscription_duration;
	}

	service.findOneRow('Order', subscriptionOrderQueryObj, subscriptionOrderIncludeArr)
		.then(function(latestSubscriptionOrder){

			latestSubscriptionPlacedOn = latestSubscriptionOrder.ordered_date;
			subscriptionRenewOn = moment(latestSubscriptionPlacedOn, "YYYY-MM-DD").add(+subscriptionDuration, 'd');

			if(subscriptionRenewOn < current_date){

				var paymentSettingModel = 'PaymentSetting';
				var cardQueryObj={};

				cardQueryObj['status'] = statusCode['ACTIVE'];
				cardQueryObj['is_primary'] = 1;
				cardQueryObj['user_id'] =  eachSubscription.user_id;

				return service.findRow(paymentSettingModel, cardQueryObj, [])
					.then(function(cardDetails){

						subscriptionCardDetails = cardDetails;

						subscriptionTotalAmount = subscribedProduct.price * eachSubscription.quantity;

						var orderBodyParam = {};

						orderBodyParam['user_id'] = eachSubscription.user_id;
						orderBodyParam['invoice_id'] = uuidv1();
						orderBodyParam['purchase_order_id'] = 'PO-' + uuidv1();
						orderBodyParam['ordered_date'] = new Date();
						orderBodyParam['status'] = statusCode['ACTIVE'];
						orderBodyParam['total_price'] = subscriptionTotalAmount;
						orderBodyParam['gtc_fees'] = subscriptionTotalAmount * .01; 
						orderBodyParam['plan_fees'] = subscriptionTotalAmount * .1;
						orderBodyParam['shipping_address_id'] = latestSubscriptionOrder.shipping_address_id;
						orderBodyParam['billing_address_id'] = latestSubscriptionOrder.billing_address_id;
						orderBodyParam['order_status'] = orderStatusCode['NEWORDER'];
						orderBodyParam['vendor_pay'] = 100;
						orderBodyParam['created_by'] = eachSubscription.User.first_name;
						orderBodyParam['created_on'] = new Date();

						return service.createRow('Order', orderBodyParam);

					}).then(function(createdSubscriptionOrder){

						var orderItemBodyParam = {};

						var shippingTotal =  eachSubscription.quantity * subscribedProduct.shipping_cost;
						var finalPrice = shippingTotal + subscriptionTotalAmount;

						orderItemBodyParam['order_id'] = createdSubscriptionOrder.id;
						orderItemBodyParam['product_id'] = subscribedProduct.id;
						orderItemBodyParam['quantity'] =  eachSubscription.quantity;
						orderItemBodyParam['shipping_total'] =  shippingTotal;
						orderItemBodyParam['subtotal'] =  subscriptionTotalAmount;
						orderItemBodyParam['final_price'] = finalPrice;
						orderItemBodyParam['status'] = statusCode['ACTIVE'];
						orderItemBodyParam['created_by'] = eachSubscription.User.first_name;
						orderItemBodyParam['created_on'] = new Date();

						return service.createRow('OrderItem',orderItemBodyParam)

					}).then(function(subscriptionOrderItemRow){

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
						console.log("-----------------paymentModelObj--------------------------",paymentModelObj);
						return service.createRow('Payment', paymentModelObj);
					}).then(function(paymentRow){

						console.log("-------------------paymentRow-----------------------------",paymentRow);
						var orderPaymentObj = {
							order_id: createdSubscriptionOrder.order.id,
							payment_id: paymentRow.id,
							order_payment_type: ORDER_PAYMENT_TYPE['ORDER_PAYMENT'],
							status: statusCode['ACTIVE'],
							created_on: new Date(),
							created_by: eachSubscription.User.first_name
						};
						console.log("-------------------paymentRow-----------------------------",orderPaymentObj);
						//return service.createRow('OrderPayment', orderPaymentObj)
					/*}).then(function(orderPaymentRow){
						var orderStatusUpdateObj = {}
						orderStatusUpdateObj['order_status'] = orderStatusCode['NEWORDER'];
						
						return service.updateRow('Order', orderStatusUpdateObj);
					}).then(function(updatedOrderRow){

						return service.findIdRow('Product', subscribedProduct.id)
							.then(function(product){
								let quantityUpdate = {};
								let currentQuantity = product.quantity_available - 1;
								quantityUpdate.quantity_available = currentQuantity;

								if (currentQuantity == 0) {
									quantityUpdate.status = statusCode['SOLDOUT'];
								}

								return service.updateRow('Product', quantityUpdate, productId)
									.then(upadtedRow => {
										return Promise.resolve(upadtedRow);
									}).catch(function(error){
									return Promise.reject(err);
									})
							}).catch(function(error){
								return Promise.reject(err);
							})*/
					}).catch(function(error){
						console.log("Error::",error);

						/*var orderStatusUpdateObj = {}
						orderStatusUpdateObj['order_status'] = orderStatusCode['FAILEDORDER'];

						return service.updateRow('Order', orderStatusUpdateObj)
							.then(function(updatedRow){
								return Promise.reject(error);
							}).catch(function(err){
								return Promise.reject(err);
							})
						return Promise.reject(error);*/
					});
				}else{
					return;
				}
		}).catch(function(error){
			console.log("Error::", error);
            return Promise.reject(error);
		});
}

