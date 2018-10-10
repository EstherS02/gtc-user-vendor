const sequelize = require('sequelize');
const model = require('../sqldb/model-connect');
const config = require('../config/environment');
const statusCode = require('../config/status');
const service = require('../api/service');
const _ = require('lodash');
const stripe = require('../payment/stripe.payment');
const sendEmail = require('./send-email');
const populate = require('../utilities/populate');
const paymentMethod = require('../config/payment-method');
const gtcPlan = require('../config/gtc-plan');
const moment = require('moment');

const CURRENCY = 'usd';
var currentDate = new Date();

export function planRenewal(job, done) {

	console.log("**********JOBS CALLED")
    console.log('agenda for plan-auto-renewal..');

	var offset, limit, field, order;

	offset = null;
	limit = null;
	field = 'id';
	order = 'asc';

	var planQueryObj = {}, planIncludeArr = [];
	var vendorModel = 'VendorPlan';

	planQueryObj['status'] = statusCode['ACTIVE'];
	planQueryObj['end_date'] = {
		'$lt': currentDate
	}

	planIncludeArr = [
		{
			model: model['Vendor'],
			where: {
				status: statusCode['ACTIVE']
			},
			attributes: ['id', 'user_id'],
			include: [
				{ 
					model: model['User'],
					where: {
						status: statusCode['ACTIVE']
					},
					attributes: ['id','email']
				}
			]		
		},
		{
			model: model['Plan'],
			where: {
				status: statusCode['ACTIVE'],
				id: {
					'$ne': gtcPlan['STARTER_SELLER']
				}
			},
			attributes:['id','name', 'cost']
		}
	]

	service.findAllRows(vendorModel, planIncludeArr, planQueryObj, offset, limit, field, order)
		.then(function(plans){

			var primaryCardPromise = [];
			_.forOwn(plans.rows, function (vendorPlan) {

				if(vendorPlan.auto_renewal == 1){
					primaryCardPromise.push(primaryCardDetails(vendorPlan));
				}else{
					if(vendorPlan.Vendor.User.user_contact_email){
						planDeactivated(vendorPlan);
					}
				}
			});
			return Promise.all(primaryCardPromise);
			
		}).then(function(primaryCard){
			done();

		}).catch(function(error){
			console.log("Error::", error);
			done();
		})
}

function primaryCardDetails(vendorPlan){
	
	var cardQueryObj={}, chargedAmount;
	var paymentSettingModel = 'PaymentSetting';

	cardQueryObj['status'] = statusCode['ACTIVE'];
	cardQueryObj['is_primary'] = 1;
	cardQueryObj['user_id'] =  vendorPlan.Vendor.user_id;

	return service.findRow(paymentSettingModel, cardQueryObj, [])
		.then(function(cardDetails){
			if(cardDetails){

				var desc = "GTC Plan Payment";

				return stripe.chargeCustomerCard(cardDetails.stripe_customer_id, cardDetails.stripe_card_id, vendorPlan.Plan.cost, desc, CURRENCY)
					.then(function(paymentDetails){
						if (paymentDetails.paid = "true"){
							chargedAmount = paymentDetails.amount / 100.0;
							var paymentObj = {
								date: new Date(paymentDetails.created),
								amount: paymentDetails.amount / 100.0,
								payment_method: paymentMethod['STRIPE'],
								status: statusCode['ACTIVE'],
								payment_response: JSON.stringify(paymentDetails)
							}
							return service.createRow('Payment', paymentObj);
						}
					}).then(function(paymentRow){
						if(paymentRow){
							var vendorPlanModel = 'VendorPlan';
							var planUpdateObj = {
								status: statusCode['ACTIVE'],
								end_date: moment().add(30, 'd').toDate()
							}
							if(vendorPlan.Vendor.User.user_contact_email){
								autoRenewalMail(vendorPlan, chargedAmount);
							}
							return service.updateRow( vendorPlanModel, planUpdateObj,vendorPlan.id);
						}						
					}).then(function(planRow){
						return Promise.resolve(planRow);
					}).catch(function(error){
						console.log("Error::",error);
						return Promise.reject(error);
					})
			}
			else{
				var vendorPlanModel = 'VendorPlan';
				var planUpdateObj = {
					status: statusCode['INACTIVE']
				}
				return service.updateRow( vendorPlanModel, planUpdateObj,vendorPlan.id)
					.then(function(planRow){
						if(vendorPlan.Vendor.User.user_contact_email){
							updatePrimaryCardMail(vendorPlan);
						}
						return Promise.resolve(planRow);

					}).catch(function(error){
						console.log("Error::",error);
						return Promise.reject(error);
					})
			}
		}).catch(function(error){
			console.log("Error::",error);
			return Promise.reject(error);
		})	
}

function updatePrimaryCardMail(vendorPlan) {

	var vendor = vendorPlan.Vendor;
	
	var emailTemplateQueryObj = {};
    var emailTemplateModel = "EmailTemplate";
    emailTemplateQueryObj['name'] = config.email.templates.autoRenewalNoPrimaryCard;

	return service.findOneRow('EmailTemplate', emailTemplateQueryObj)
        .then(function (response) {
            if (response) {

                var email = vendor.User.user_contact_email;

                var subject = response.subject;
				var body = response.body;
				body = body.replace('%USERNAME%', vendor.vendor_name);
				body = body.replace('%PLAN_NAME%', vendorPlan.Plan.name);
				body = body.replace('%EXPIRED_DATE%', vendorPlan.end_date);

                sendEmail({
                    to: email,
                    subject: subject,
                    html: body
                });
                return;
            } else {
                return;
            }

        }).catch(function (error) {
            console.log("Error::", error);
            return;
        });
}

function autoRenewalMail(vendorPlan, chargedAmount){

	var vendor = vendorPlan.Vendor;
	
	var emailTemplateQueryObj = {};
    var emailTemplateModel = "EmailTemplate";
    emailTemplateQueryObj['name'] = config.email.templates.planAutoRenewal;

	return service.findOneRow('EmailTemplate', emailTemplateQueryObj)
        .then(function (response) {
            if (response) {

				var email = vendor.User.user_contact_email;

                var subject = response.subject;
				var body = response.body;
				body = body.replace('%USERNAME%', vendor.vendor_name);
				body = body.replace('%PLAN_NAME%', vendorPlan.Plan.name);
				body = body.replace('%EXPIRED_DATE%', vendorPlan.end_date);
				body = body.replace('%CURRENT_DATE%', currentDate);
				body = body.replace('%AMOUNT%', chargedAmount);

                sendEmail({
                    to: email,
                    subject: subject,
                    html: body
                });
                return;
            } else {
                return;
            }

        }).catch(function (error) {
            console.log("Error::", error);
            return;
        });
}

function planDeactivated(vendorPlan){

	var vendor = vendorPlan.Vendor;
	
	var emailTemplateQueryObj = {};
    var emailTemplateModel = "EmailTemplate";
	emailTemplateQueryObj['name'] = config.email.templates.planExpired;
	
	return service.findOneRow('EmailTemplate', emailTemplateQueryObj)
        .then(function (response) {
            if (response) {

				var email = vendor.User.user_contact_email;

                var subject = response.subject;
				var body = response.body;
				body = body.replace('%USERNAME%', vendor.vendor_name);
				body = body.replace('%PLAN_NAME%', vendorPlan.Plan.name);
				body = body.replace('%EXPIRED_DATE%', vendorPlan.end_date);

                sendEmail({
                    to: email,
                    subject: subject,
                    html: body
                });
                return;
            } else {
                return;
            }

        }).catch(function (error) {
            console.log("Error::", error);
            return;
        });
}
