const sequelize = require('sequelize');
const model = require('../../sqldb/model-connect');
const config = require('../../config/environment');
const statusCode = require('../../config/status');
const service = require('../service');
const _ = require('lodash');
const stripe = require('../../payment/stripe.payment');
const sendEmail = require('../../agenda/send-email');
const populate = require('../../utilities/populate');
const paymentMethod = require('../../config/payment-method');

export function planRenewal(req, res) {

	var offset, limit, field, order, currentDate;

	offset = null;
	limit = null;
	field = 'id';
	order = 'asc';

	var planQueryObj = {}, planIncludeArr = [];
	var vendorModel = 'VendorPlan';

	currentDate = new Date();

	planQueryObj['status'] = statusCode["ACTIVE"];
	planQueryObj['end_date'] = {
		'$lt': currentDate
	}

	planIncludeArr = [
		{
			model: model["Vendor"],
			where: {
				status: statusCode["ACTIVE"]
			}		
		}
	]

	service.findAllRows(vendorModel, planIncludeArr, planQueryObj, offset, limit, field, order)
		.then(function(plans){

			var primaryCardPromise = [];
			_.forOwn(plans.rows, function (vendorPlan) {

				primaryCardPromise.push(primaryCardDetails(vendorPlan));
			});
			return Promise.all(primaryCardPromise);
			
		}).then(function(primaryCard){
			return res.status(200).send(primaryCard);

		}).catch(function(error){
			console.log("Error::", error);
      		return res.status(400).send(error);
		})
}

function primaryCardDetails(vendorPlan){
	
	var cardQueryObj={};
	var paymentSettingModel = 'PaymentSetting';

	cardQueryObj['status'] = statusCode['ACTIVE'];
	cardQueryObj['is_primary'] = 1;
	cardQueryObj['user_id'] =  vendorPlan.Vendor.user_id;

	return service.findRow(paymentSettingModel, cardQueryObj, [])
		.then(function(cardDetails){
			if(cardDetails){
				return Promise.resolve(cardDetails);
			}
			else{
				// need to do....
				return;
			}

		}).catch(function(error){
			console("Error::",error);
			return Promise.reject(error);
		})	
}

