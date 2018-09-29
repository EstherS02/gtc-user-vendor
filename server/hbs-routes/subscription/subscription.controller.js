'use strict';

const async = require('async');
const config = require('../../config/environment');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const vendorPlan = require('../../config/gtc-plan');
const cartService = require('../../api/cart/cart.service');
const marketplace = require('../../config/marketplace');

export function subscribe(req, res) {
	var LoggedInUser = {};

	if (req.user)
		LoggedInUser = req.user;

	async.series({

	},function(err, results) {
		if (!err) {
			res.render('userNav/add-subscription', {
				title: "Global Trade Connect",
				LoggedInUser: LoggedInUser
			})
		}else {
			res.render('userNav/add-subscription', err);
		}
	});
}


