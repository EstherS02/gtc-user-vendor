'use strict';

const async = require('async');
const _ = require('lodash');
const config = require('../../../config/environment');
const status = require('../../../config/status');
const service = require('../../../api/service');

export function shippingMethod(req, res) {
	var LoggedInUser = {};

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;

	return res.status(200).render('checkout/shipping-method', {
		title: "Global Trade Connect",
		LoggedInUser: LoggedInUser
	});
}