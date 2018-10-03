const sequelize = require('sequelize');
const model = require('../../sqldb/model-connect');
const config = require('../../config/environment');
const statusCode = require('../../config/status');
const service = require('../service');
const moment = require('moment');
const _ = require('lodash');
const stripe = require('../../payment/stripe.payment');
const sendEmail = require('../../agenda/send-email');
const populate = require('../../utilities/populate');
const durationCode = require('../../config/duration-unit');
const orderStatusCode = require('../../config/order_status');
const uuidv1 = require('uuid/v1');

const CURRENCY = 'usd';
const current_date = new Date();

export function subscription(req, res) {

	console.log('********************JOBS CALLED');
	console.log('agenda for subscription orders..');

	var offset, limit, field, order;
	var subscriptionModel = 'Subscription';
	var subscriptionQueryObj = {}, subscriptionIncludeArr = [];

	offset = null;
	limit = null;
	field = 'id';
	order = 'asc';

	subscriptionQueryObj['status'] =statusCode['ACTIVE'];

	subscriptionIncludeArr = [
		{
			"model": model['Product'],
			where: {
                status: statusCode["ACTIVE"]
				},
			attributes: ['id','price','subscription_duration','subscription_duration_unit'],		
		},
		{
			"model": model['User'],
			where: {
                status: statusCode["ACTIVE"]
				},
			attributes: ['id','first_name'],

		}
	]
	
	service.findAllRows(subscriptionModel, subscriptionIncludeArr, subscriptionQueryObj, offset, limit, field, order)
		.then(function(subscriptionRows){

			var subscriptionPromises = [];
			_.forOwn(subscriptionRows.rows, function (eachSubscription) {

				subscriptionPromises.push(subscriptionOrder(eachSubscription));
			});
			
		}).catch(function(error){
			console.log("Error:::",error)
		});
}

function subscriptionOrder(eachSubscription){
	var subscribedProduct, subscriptionDuration, latestSubscriptionPlacedOn, subscriptionRenewOn;
	var subscriptionOrderQueryObj = {}, subscriptionOrderIncludeArr = [];

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
			if(latestSubscriptionOrder){

				console.log("========================================",latestSubscriptionOrder.id)

				latestSubscriptionPlacedOn = latestSubscriptionOrder.ordered_date;
				//subscriptionRenewOn  = moment().add(+subscriptionDuration, 'd').latestSubscriptionPlacedOn;

				console.log("------------------------------------------",subscriptionDuration);
				console.log("------------------------------------------",latestSubscriptionPlacedOn);
				//console.log("------------------------------------------",subscriptionRenewOn);	

				subscriptionRenewOn = '2018-07-02T12:37:11.343Z';
				console.log("==================================",current_date);

				//if(subscriptionRenewOn < current_date){
					console.log("=======COMMING==================================")

					var paymentSettingModel = 'PaymentSetting';
					var cardQueryObj={};

					cardQueryObj['status'] = statusCode['ACTIVE'];
					cardQueryObj['is_primary'] = 1;
					cardQueryObj['user_id'] =  eachSubscription.user_id;

					return service.findRow(paymentSettingModel, cardQueryObj, [])
						.then(function(cardDetails){

							return stripe.chargeCustomerCard(cardDetails.stripe_customer_id, card_details.id, amt, desc, CURRENCY, metadata);

							var orderBodyParam = {};

							orderBodyParam['user_id'] = eachSubscription.user_id;
							orderBodyParam['invoice_id'] = uuidv1();
							orderBodyParam['purchase_order_id'] = 'PO-' + uuidv1();
							orderBodyParam['ordered_date'] = new Date();
							orderBodyParam['status'] = statusCode['ACTIVE'];
							orderBodyParam['total_price'] = subscribedProduct.price;
							orderBodyParam['gtc_fees'] = subscribedProduct.price * .01; 
							orderBodyParam['plan_fees'] = subscribedProduct.price * .1;
							orderBodyParam['shipping_address_id'] = latestSubscriptionOrder.shipping_address_id;
							orderBodyParam['billing_address_id'] = latestSubscriptionOrder.billing_address_id;
							orderBodyParam['order_status'] = orderStatusCode['NEWORDER'];
							orderBodyParam['created_by'] = eachSubscription.User.first_name;
							orderBodyParam['created_on'] = new Date();
										
							

						}).catch(function(error){
							console.log("Error::",error);
							return Promise.reject(error);
						});
				/*}else{
					return;
				}*/
			}
		}).catch(function(error){
			console.log("Error::", error);
            return Promise.reject(error);
		});
}

