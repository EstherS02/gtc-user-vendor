const sequelize = require('sequelize');
const model = require('../sqldb/model-connect');
const config = require('../config/environment');
const statusCode = require('../config/status');
const service = require('../api/service');
const _ = require('lodash');

var subscriptionModel = 'Subscription';
var currentDate = new Date();

export function subscriptionExpire(job, done) {

	console.log("**********JOBS CALLED")
    console.log('agenda for subscription-expire..');

	var offset, limit, field, order;

	offset = null;
	limit = null;
	field = 'id';
	order = 'asc';

	var subscriptionQueryObj = {};
	
	subscriptionQueryObj['status'] = statusCode['ACTIVE'];
	subscriptionQueryObj['end_date'] = {
		'$lt': currentDate
	}

	service.findAllRows(subscriptionModel, [], subscriptionQueryObj, offset, limit, field, order)
		.then(function(subscriptions){
			
			var subscriptionPromise = [];
			_.forOwn(subscriptions.rows, function (eachsubscription) {

				subscriptionPromise.push(updateStatus(eachsubscription));
			});
			return Promise.all(subscriptionPromise);

		}).then(function(upadtedRows){
			done();

		}).catch(function(error){
			done();
		});
}

function updateStatus(eachsubscription){

	var subscriptionBodyParam = {};

	subscriptionBodyParam = {
		status: statusCode['INACTIVE'],
		last_updated_by: 'GTC Auto Expire',
		last_updated_on : new Date()
	}
	return service.updateRow(subscriptionModel, subscriptionBodyParam, eachsubscription.id);
}
