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
const gtcPlan = require('../../config/gtc-plan');
const moment = require('moment');

const CURRENCY = 'usd';
var currentDate = new Date();

export function starterSellerExpires(req, res) {

	var offset, limit, field, order;

	offset = null;
	limit = null;
	field = 'id';
	order = 'asc';

	var planQueryObj = {}, planBodyParam = {}, planIncludeArr = [];
	var vendorModel = 'VendorPlan';

	planQueryObj['status'] = statusCode['ACTIVE'];
	planQueryObj['end_date'] = {
		'$lt': currentDate
	}

	planIncludeArr = [
		{
			model: model['Plan'],
			where: {
				status: statusCode['ACTIVE'],
				id: gtcPlan['STARTER_SELLER']
			},
			attribute:['id','name']
		}
	]

	planBodyParam = {
		status: statusCode['INACTIVE']
	}



	service.updateRecordNew(vendorModel, )

	service.findAllRows(vendorModel, planIncludeArr, planQueryObj, offset, limit, field, order)
		.then(function(vendorPlans){
			return res.status(200).send(vendorPlans);
		
		}).catch(function(error){
			console.log("Error::", error);
      		return res.status(400).send(error);
		})

}