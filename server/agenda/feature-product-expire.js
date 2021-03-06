const sequelize = require('sequelize');
const model = require('../sqldb/model-connect');
const config = require('../config/environment');
const statusCode = require('../config/status');
const service = require('../api/service');
const _ = require('lodash');

var currentDate = new Date();
var featureProductModel = 'FeaturedProduct';

export function featureProductExpire(job, done) {

	console.log("**********JOBS CALLED")
    console.log('agenda for feature-product-expire..');

	var offset, limit, field, order;

	offset = null;
	limit = null;
	field = 'id';
	order = 'asc';

	var featureQueryObj = {}, featureIncludeArr = [];
	

	featureQueryObj['status'] = statusCode['ACTIVE'];
	featureQueryObj['end_date'] = {
		'$lt': currentDate
	}

	featureIncludeArr = [
		{
			model: model ['Product'],
			where: {
					status: statusCode['ACTIVE']
			},
			attributes: ['id', 'vendor_id', 'product_name'],
			include: [
				{
					model: model['Vendor'],
					where: {
						status: statusCode['ACTIVE']
					},
					attributes: ['id', 'user_id', 'vendor_name'],
					include: [
						{ 
							model: model['User'],
							where: {
						   		status: statusCode['ACTIVE']
							},
							attributes: ['id','email']
						}
					]		
				}
			]
		}
	]

	service.findAllRows(featureProductModel, featureIncludeArr, featureQueryObj, offset, limit, field, order)
		.then(function(featureExpired){
			
			var featurePromise = [];
			_.forOwn(featureExpired.rows, function (eachProduct) {

				featurePromise.push(updateFeatureStatus(eachProduct));
			});
			return Promise.all(featurePromise);

		}).then(function(upadtedRows){
			done();

		}).catch(function(error){
			console.log("Error::", error);
			done();
		});
}

function updateFeatureStatus(eachProduct){

	var featureBodyParam = {};

	featureBodyParam = {
		feature_status: statusCode['INACTIVE'],
		last_updated_by: 'GTC Auto Expire',
		last_updated_on : new Date()
	}
	if(eachProduct.Product.Vendor.User.user_contact_email){
		featurePromotionExpiredMail(eachProduct);
	}
	return service.updateRow(featureProductModel, featureBodyParam, eachProduct.id);
}

function featurePromotionExpiredMail(eachProduct){

	var vendor = eachProduct.Product.Vendor;
	
	var emailTemplateQueryObj = {};
	var mailArray = [];
    var emailTemplateModel = "EmailTemplate";
	emailTemplateQueryObj['name'] = config.email.templates.featureProductExpire;
	var agenda = require('../app').get('agenda');

	return service.findOneRow('EmailTemplate', emailTemplateQueryObj)
        .then(function (response) {
            if (response) {

				var email = vendor.User.user_contact_email;

                var subject = response.subject;
				var body = response.body;
				body = body.replace('%USERNAME%', vendor.vendor_name);
				body = body.replace('%PRODUCT_NAME%', eachProduct.Product.product_name);
				body = body.replace('%EXPIRED_DATE%', eachProduct.end_date);

				mailArray.push({
					to: email,
					subject: subject,
					html: body
				});
				agenda.now(config.jobs.email, {
					mailArray: mailArray
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