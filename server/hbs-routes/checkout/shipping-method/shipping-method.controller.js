'use strict';

const async = require('async');

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