'use strict';

const async = require('async');
const config = require('../../config/environment');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const vendorPlan = require('../../config/gtc-plan');
const cartService = require('../../api/cart/cart.service');
const marketplace = require('../../config/marketplace');

export function subscribe(req, res) {

	var productId;
	var LoggedInUser = {};

	if (req.params.id)
		productId = req.params.id;

	if (req.user)
		LoggedInUser = req.user;

	async.series({
		productInfo: function(callback) {
			service.findIdRow('Product', productId, [])
				.then(function(productInfo) {
					return callback(null, productInfo);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},

	},function(err, results) {
		if (!err) {
			res.render('userNav/add-subscription', {
				title: "Global Trade Connect",
				LoggedInUser: LoggedInUser,
				productInfo: results.productInfo
			})
		}else {
			res.render('userNav/add-subscription', err);
		}
	});
}


