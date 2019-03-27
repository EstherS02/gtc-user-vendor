const model = require('../sqldb/model-connect');
const config = require('../config/environment');
const statusCode = require('../config/status');
const service = require('../api/service');
const moment = require('moment');
const _ = require('lodash');
const stripe = require('../payment/stripe.payment');
const durationCode = require('../config/duration-unit');
const orderStatusNew = require('../config/order-item-new-status');
const paymentMethod = require('../config/payment-method');
const marketPlaceCode = require('../config/marketplace');
const uuidv1 = require('uuid/v1');

const CURRENCY = config.order.currency;
const current_date = new Date();

export function subscriptionAutoRenewal(job, done) {

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
			attributes: ['id','product_name', 'price', 'subscription_duration', 'subscription_duration_unit', 'shipping_cost', 'marketplace_id', 'vendor_id'],
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
			console.log("result",result);
			done();

		}).catch(function(error) {
			console.log("error",error);
			done();
		});
}

function subscriptionOrder(eachSubscription) {


	var subscribedProduct, subscriptionDuration, latestSubscriptionPlacedOn, subscriptionRenewOn, subscriptionTotalAmount, shippingTotal, finalPrice;
	var subscriptionOrderQueryObj = {}, subscriptionCardDetails = {}, createdSubscription = {}, subscriptionOrderIncludeArr = [];
	var agenda = require('../app').get('agenda');

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
			
			if (subscriptionRenewOn <= current_date) {

				var paymentSettingModel = 'PaymentSetting';
				var cardQueryObj = {};

				cardQueryObj['status'] = statusCode['ACTIVE'];
				cardQueryObj['is_primary'] = 1;
				cardQueryObj['user_id'] = eachSubscription.user_id;

				return service.findRow(paymentSettingModel, cardQueryObj, [])
					.then(function(cardDetails) {
						if(cardDetails){
							subscriptionCardDetails = cardDetails;
							subscriptionTotalAmount = subscribedProduct.price * eachSubscription.quantity;
							
							var orderBodyParam = {};

							var desc = 'Subscription Auto Renewal Order';
							return stripe.chargeCustomerCard(subscriptionCardDetails.stripe_customer_id, subscriptionCardDetails.stripe_card_id, subscriptionTotalAmount, desc, CURRENCY);
						}
					}).then(charge => {	
						if(charge){
							var paymentModelObj = {
								date: new Date(charge.created),
								amount: charge.amount / 100.0,
								payment_method: paymentMethod['STRIPE'],
								status: statusCode['ACTIVE'],
								payment_response: JSON.stringify(charge),
								created_by: 'GTC Auto Subscription Order',
								created_on: current_date
							};
							return service.createRow('Payment', paymentModelObj);
						}	
					}).then(function(paymentRow) {
						if(paymentRow){
							var orderBodyParam = {};

							orderBodyParam['user_id'] = eachSubscription.user_id;
							orderBodyParam['invoice_id'] = uuidv1();
							orderBodyParam['purchase_order_id'] = 'PO-' + uuidv1();
							orderBodyParam['po_number'] = null;
							orderBodyParam['total_order_items'] = eachSubscription.quantity;
							orderBodyParam['total_price'] = paymentRow.amount;
							orderBodyParam['ordered_date'] = current_date;
							orderBodyParam['payment_id'] = paymentRow.id;
							orderBodyParam['shipping_id'] = null;						
							orderBodyParam['shipping_address_id'] = latestSubscriptionOrder.shipping_address_id;
							orderBodyParam['billing_address_id'] = latestSubscriptionOrder.billing_address_id;
							orderBodyParam['status'] = statusCode['ACTIVE'];
							orderBodyParam['created_by'] = eachSubscription.User.first_name;
							orderBodyParam['created_on'] = current_date;

							return service.createRow('Order', orderBodyParam);
						}
					}).then(function(createdSubscriptionOrder) {

						if(createdSubscriptionOrder){
							var orderItemBodyParam = {};

							createdSubscription = createdSubscriptionOrder;

							orderItemBodyParam['order_id'] = createdSubscriptionOrder.id;
							orderItemBodyParam['product_id'] = subscribedProduct.id;
							orderItemBodyParam['quantity'] = eachSubscription.quantity;
							orderItemBodyParam['price'] = subscriptionTotalAmount;
							orderItemBodyParam['shipping_cost'] = 0;
							orderItemBodyParam['gtc_fees'] = (subscriptionTotalAmount / 100 * parseFloat(config.order.gtc_fees)).toFixed(2);

							if (subscribedProduct.marketplace_id == marketPlaceCode['SERVICE']) {
								orderItemBodyParam['plan_fees'] = (subscriptionTotalAmount / 100 * parseFloat(config.order.service_fee)).toFixed(2);
							} else if (subscribedProduct.marketplace_id == marketPlaceCode['LIFESTYLE']) {
								orderItemBodyParam['plan_fees'] = (subscriptionTotalAmount / 100 * config.order.lifestyle_fee).toFixed(2);
							} else {
								orderItemBodyParam['plan_fees'] = 0;
							}
							orderItemBodyParam['coupon_amount'] = 0;
							orderItemBodyParam['is_on_sale_item'] = 0;
							orderItemBodyParam['final_price'] = (parseFloat(orderItemBodyParam['price']) - (parseFloat(orderItemBodyParam['gtc_fees']) + parseFloat(orderItemBodyParam['plan_fees']) + parseFloat(orderItemBodyParam['coupon_amount'])));

							orderItemBodyParam['order_item_status'] = orderStatusNew['ORDER_INITIATED'];
							orderItemBodyParam['is_coupon_applied'] = 0;
							orderItemBodyParam['status'] = statusCode['ACTIVE'];
							orderItemBodyParam['created_by'] = eachSubscription.User.first_name;
							orderItemBodyParam['created_on'] = current_date;
							
							return service.createRow('OrderItem', orderItemBodyParam);
						}					
					}).then(function(subscriptionOrderItemRow) {
						if(subscriptionOrderItemRow){
							var orderVendorBodyParam = {
								order_id: createdSubscription.id,
								vendor_id: subscribedProduct.vendor_id,
								total_price: parseFloat(subscriptionOrderItemRow['price']),
								shipping_cost: parseFloat(subscriptionOrderItemRow['shipping_cost']),
								gtc_fees: parseFloat(subscriptionOrderItemRow['gtc_fees']),
								gtc_fees_percent: parseFloat(config.order.gtc_fees),
								plan_fees: parseFloat(subscriptionOrderItemRow['plan_fees']),
								plan_fees_percent: parseFloat(config.order.service_fee),
								coupon_amount: parseFloat(subscriptionOrderItemRow['coupon_amount']),
								final_price: parseFloat(subscriptionOrderItemRow['final_price']),
								status: statusCode['ACTIVE'],
								created_by: eachSubscription.User.first_name,
								created_on: new Date()
							};
							return service.createRow('OrderVendor', orderVendorBodyParam);
						}
					}).then(function(orderVendorRow) {
						if(orderVendorRow){
							agenda.now(config.jobs.orderNotification, {
								order: createdSubscription.id,
								code: config.notification.templates.vendorNewOrder
							});
				
							agenda.now(config.jobs.orderNotification, {
								order: createdSubscription.id,
								code: config.notification.templates.orderDetail
							});
				
							agenda.now(config.jobs.orderEmail, {
								order: createdSubscription.id
							});
							return service.findIdRow('Product', subscribedProduct.id);
						}
					}).then(function(product){
						if(product){
							let quantityUpdate = {};
							let currentQuantity = product.quantity_available - eachSubscription.quantity;
							quantityUpdate.quantity_available = currentQuantity;

							if (currentQuantity == 0) {
								quantityUpdate.status = statusCode['SOLDOUT'];
							}

							return service.updateRow('Product', quantityUpdate, product.id);
						}		
					}).then(function(upadtedProductRow){
						if(upadtedProductRow){
							var nextSubscriptionRenewOn = moment(current_date, "YYYY-MM-DD").add(+subscriptionDuration, 'd');

							let subscriptionUpdate = {};
							subscriptionUpdate.last_order_placed_on = current_date;
							subscriptionUpdate.next_order_place_on = nextSubscriptionRenewOn;
							subscriptionUpdate.last_updated_by = 'GTC Auto Subscription Order';
							subscriptionUpdate.last_updated_on = current_date;

							return service.updateRow('Subscription', subscriptionUpdate, eachSubscription.id);
						}
					}).then(function(updatedSubscriptionRow){
						if(updatedSubscriptionRow){
							return Promise.resolve(updatedSubscriptionRow);
						}else{
							return Promise.resolve(null);
						}				
					}).catch(function(error) {
						console.log("Error::", error);
						return Promise.reject(error);
					});		
			}
		}).catch(function(error) {
			console.log("Error::", error);
			return Promise.reject(error);
		});
}	


