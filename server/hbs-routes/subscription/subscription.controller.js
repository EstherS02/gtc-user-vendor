'use strict';

const async = require('async');
const config = require('../../config/environment');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const vendorPlan = require('../../config/gtc-plan');
const cartService = require('../../api/cart/cart.service');
const marketplace = require('../../config/marketplace');
const populate = require('../../utilities/populate');

export function subscriptions(req, res) {

	var LoggedInUser = {}, subscriptionQueryObj = {};
	var subscriptionIncludeArr = []

	var offset, limit, field, order;

	offset = 0;
	limit = null;
	field = "id";
	order = "asc";

	if (req.user)
		LoggedInUser = req.user;

	subscriptionIncludeArr = populate.populateData('Product');

	async.series({
		subscriptions: function(callback) {

			service.findRows('Subscription', subscriptionQueryObj, offset, limit, field, order, subscriptionIncludeArr) 
				.then(function(subscriptions){

					return callback(null, subscriptions);
				}).catch(function(error){
					return callback(error);
				})
		},
	},function(err, results) {
		if (!err) {
			res.render('userNav/view-subscription', {
				title: "Global Trade Connect",
				LoggedInUser: LoggedInUser,
				subscriptions: results.subscriptions.rows,
				collectionSize: results.subscriptions.count,
				selectedPage: 'subscription',
				statusCode: statusCode
			})
		}else {
			res.render('userNav/view-subscription', err);
		}
	});
}


