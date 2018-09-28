const sequelize = require('sequelize');
const model = require('../sqldb/model-connect');
const config = require('../config/environment');
const statusCode = require('../config/status');
const service = require('../api/service');
const _ = require('lodash');
const sendEmail = require('./send-email');
const gtcPlan = require('../config/gtc-plan');

var currentDate = new Date();
var vendorPlanModel = 'VendorPlan';

export function starterPlanExpire(job, done) {

	console.log("**********JOBS CALLED")
    console.log('agenda for starter-plan-expire..');

	var offset, limit, field, order;

	offset = null;
	limit = null;
	field = 'id';
	order = 'asc';

	var planQueryObj = {}, planIncludeArr = [];
	

	planQueryObj['status'] = statusCode['ACTIVE'];
	planQueryObj['end_date'] = {
		'$lt': currentDate
	}
	planQueryObj['plan_id'] = gtcPlan['STARTER_SELLER'];

	planIncludeArr = [
		{
			model: model['Vendor'],
			where: {
				status: statusCode['ACTIVE']
			},
			attribute: ['id', 'user_id'],
			include: [
				{ 
					model: model['User'],
					where: {
				   		status: statusCode['ACTIVE']
					},
					attribute: ['id','email']
				}
			]		
		}
	]

	service.findAllRows(vendorPlanModel, planIncludeArr, planQueryObj, offset, limit, field, order)
		.then(function(staterSellers){
			
			var starterPromise = [];
			_.forOwn(staterSellers.rows, function (eachVendor) {

				starterPromise.push(updateStatus(eachVendor));
			});
			return Promise.all(starterPromise);

		}).then(function(upadtedRows){
			done();

		}).catch(function(error){
			console.log("Error::", error);
			done();
		});
}

function updateStatus(eachVendor){

	var planBodyParam = {};

	planBodyParam = {
		status: statusCode['INACTIVE']
	}
	if(eachVendor.Vendor.User.user_contact_email){
		planExpiredMail(eachVendor);
	}
	return service.updateRow(vendorPlanModel, planBodyParam, eachVendor.id);
}

function planExpiredMail(eachVendor){

	var vendor = eachVendor.Vendor;
	
	var emailTemplateQueryObj = {};
    var emailTemplateModel = "EmailTemplate";
    emailTemplateQueryObj['name'] = config.email.templates.starterPlanExpire;

	return service.findOneRow('EmailTemplate', emailTemplateQueryObj)
        .then(function (response) {
            if (response) {

				var email = vendor.User.user_contact_email;

                var subject = response.subject;
				var body = response.body;
				body = body.replace('%USERNAME%', vendor.vendor_name);
				body = body.replace('%EXPIRED_DATE%', eachVendor.end_date);

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