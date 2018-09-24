const sequelize = require('sequelize');
const model = require('../../sqldb/model-connect');
const config = require('../../config/environment');
const statusCode = require('../../config/status');
const service = require('../service');
const _ = require('lodash');
const sendEmail = require('../../agenda/send-email');
const gtcPlan = require('../../config/gtc-plan');

var vendorPlanModel = 'VendorPlan';

export function starterSellerExpires(req, res) {

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
			return res.status(200).send(upadtedRows);

		}).catch(function(error){
			console.log("Error::", error);
			return res.status(400).send(error);
		});
}

function updateStatus(eachVendor){

	var planBodyParam = {};

	planBodyParam = {
		status: statusCode['INACTIVE']
	}
	planExpiredMail(eachVendor);
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

				var email = vendor.User.email;

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