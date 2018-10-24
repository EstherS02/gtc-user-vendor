const sequelize = require('sequelize');
const model = require('../sqldb/model-connect');
const config = require('../config/environment');
const statusCode = require('../config/status');
const service = require('../api/service');
const moment = require('moment');
const _ = require('lodash');
const stripe = require('../payment/stripe.payment');
const paymentMethod = require('../config/payment-method');

const CURRENCY = 'usd';
const current_date = new Date();


export function featureProductAutoRenewal(job, done) {

	console.log('********************JOBS CALLED');
	console.log('agenda for feature product auto renewal..');

	var offset, limit, field, order;
	var featureRenewalQueryObj = {}, featureRenewalIncludeArr = [];

	offset = null;
	limit = null;
	field = 'id';
	order = 'asc';

	featureRenewalQueryObj = {
		feature_indefinitely: 1,
		feature_status: statusCode['ACTIVE'],
		status: statusCode['ACTIVE']
	}

	featureRenewalIncludeArr = [
		{
			"model": model['Product'],
			where: {
				status: statusCode["ACTIVE"],
			},
			attributes:['id', 'vendor_id', 'product_name'],
			include:[
				{
					"model": model['Vendor'],
					where: {
						status: statusCode["ACTIVE"]
					},
					attributes:['id', 'user_id', 'vendor_name'],
					include:[
						{
							"model": model['User'],
							where: {
								status: statusCode["ACTIVE"]
							},
							attributes:['id', 'user_contact_email'],
						}
					]
				}
			]
		},
		{
			"model": model['Payment'],
			where: {
				status: statusCode["ACTIVE"],
			},
			attributes:['id', 'amount'],			
		}
	]

	service.findAllRows('FeaturedProduct', featureRenewalIncludeArr, featureRenewalQueryObj, offset, limit, field, order)
		.then(function(featureRows) {

			var featurePromises = [];
			_.forOwn(featureRows.rows, function(eachFeature) {

				featurePromises.push(FeatureAutoRenewal(eachFeature));
			});
			return Promise.all(featurePromises);
		}).then(function(result){
			console.log("result",result);
			done();

		}).catch(function(error) {
			console.log("error",error);
			done();
		});
}

function FeatureAutoRenewal(eachFeature){
	var startDate, featureRenewOn, renewalAmount, renewalPaymentId;

	startDate = eachFeature.start_date;
	featureRenewOn = moment(startDate, "YYYY-MM-DD").add(+28, 'd');
	renewalAmount = eachFeature.Payment.amount;

	if (featureRenewOn < current_date) {

		var cardQueryObj = {};

		cardQueryObj['status'] = statusCode['ACTIVE'];
		cardQueryObj['is_primary'] = 1;
		cardQueryObj['user_id'] = eachFeature.Product.Vendor.user_id;

		return service.findRow('PaymentSetting', cardQueryObj, [])
			.then(function(cardDetails){
				if(cardDetails){
					var desc = 'Feature Product Auto Renewal Order';
					return stripe.chargeCustomerCard(cardDetails.stripe_customer_id, cardDetails.stripe_card_id, renewalAmount, desc, CURRENCY)
					.then(charge => {
								
						var paymentModelObj = {
							date: new Date(charge.created),
							amount: charge.amount / 100.0,
							payment_method: paymentMethod['STRIPE'],
							status: statusCode['ACTIVE'],
							payment_response: JSON.stringify(charge)
						};
						return service.createRow('Payment', paymentModelObj);

					}).then(function(paymentRow) {
						renewalPaymentId = paymentRow.id;

						var deativateBodyParam ={
							status: statusCode['INACTIVE'],
							feature_status: statusCode['INACTIVE']
						}
						return service.updateRow('FeaturedProduct', deativateBodyParam, eachFeature.id);

					}).then(function(deactivatedRow) {
						delete eachFeature.id;
						var newFeatureRow = eachFeature;
						newFeatureRow.start_date = current_date;
						newFeatureRow.payment_id = renewalPaymentId;
						newFeatureRow.created_on = current_date;

						return service.createRow('FeaturedProduct', newFeatureRow);

					}).then(function(createdFeatureRow){

						if(eachFeature.Product.Vendor.User.user_contact_email){
							featureRenewalMail(eachFeature);
						}						
						return Promise.resolve(createdFeatureRow);
					}).catch(function(error){

						console.log("Error::", error);
						return Promise.reject(error);
					})

				}else{
					return Promise.resolve(null);
				}

			}).catch(function(error){
				console.log("Error::", error);
				return Promise.reject(error);
			})
	} else{
		return Promise.resolve(null);
	}
}

function featureRenewalMail(eachFeature){
	var emailTemplateQueryObj = {};
	var mailArray = [];
    emailTemplateQueryObj['name'] = config.email.templates.featureProductAutoRenewal;

	var agenda = require('../../app').get('agenda');
	return service.findOneRow('EmailTemplate', emailTemplateQueryObj)
		.then(function (response) {
			if (response) {
				var email = eachFeature.Product.Vendor.User.user_contact_email;				
                var subject = response.subject;
                var body;
				body = response.body.replace('%USER_NAME%', eachFeature.Product.Vendor.vendor_name);
				body = body.replace('%PRODUCT_NAME%', eachFeature.Product.product_name);
				body = body.replace('%AMOUNT%', eachFeature.Payment.amount);
				body = body.replace('%CURRENT_DATE%', current_date);
					
				mailArray.push({
					to: email,
					subject: subject,
					html: body
				});
				agenda.now(config.jobs.email, {
					mailArray: mailArray
				});
				return;
			}else{
				return;
			}
		}).catch(function(error){
			return;
		})
}

