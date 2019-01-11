'use strict';

const async = require('async');
const paypal = require('paypal-rest-sdk');
const config = require('../../config/environment');
const status = require('../../config/status');
const marketplace = require('../../config/marketplace');
const service = require('../../api/service');
const cartService = require('../../api/cart/cart.service');
const vendorPlan = require('../../config/gtc-plan');
const addressCode = require('../../config/address');
const notifictionService = require('../../api/notification/notification.service');
var openIdConnect = paypal.openIdConnect;

paypal.configure({
	'mode': config.payPalOAuth.payPalMode,
	'openid_client_id': config.payPalOAuth.clientId,
	'openid_client_secret': config.payPalOAuth.clientSecret,
	'openid_redirect_uri': config.payPalOAuth.redirectUrl
});

export function billingSettings(req, res) {
	
	var LoggedInUser = {}, bottomCategory = {}, queryObjCategory = {};
	var user_id;

	if (req.user)
		LoggedInUser = req.user;

	user_id = LoggedInUser.id;

	let payPalOAuthUrl = openIdConnect.authorizeUrl({
		'scope': config.payPalOAuth.scope
	});

	queryObjCategory = {
		status: status['ACTIVE']
	};

	async.series({
		cartInfo: function(callback) {
			if (LoggedInUser.id) {
				cartService.cartCalculation(LoggedInUser.id, req, res)
					.then((cartResult) => {
						return callback(null, cartResult);
					}).catch((error) => {
						return callback(error);
					});
			} else {
				return callback(null);
			}
		},
		categories: function(callback) {
			var includeArr = [];
			var categoryOffset, categoryLimit, categoryField, categoryOrder;
			var categoryQueryObj = {};

			categoryOffset = 0;
			categoryLimit = null;
			categoryField = "id";
			categoryOrder = "asc";
			
			categoryQueryObj['status'] = status["ACTIVE"];

			service.findAllRows('Category', includeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
				.then(function(category) {
					var categories = category.rows;
					bottomCategory['left'] = categories.slice(0, 8);
					bottomCategory['right'] = categories.slice(8, 16);
					return callback(null, category.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		cards: function(callback) {
			var includeArr = [];
			var offset, limit, field, order;
			offset = 0;
			limit = null;
			field = "id";
			order = "asc";
			queryObjCategory.user_id = req.user.id;

			service.findAllRows('PaymentSetting', includeArr, queryObjCategory, offset, limit, field, order)
				.then(function(paymentSetting) {
					var paymentSettings = paymentSetting.rows;
					return callback(null, paymentSettings);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		billingAddress: function(callback) {
			var includeArr = [];
			var offset, limit, field, order;
			offset = 0;
			limit = null;
			field = "id";
			order = "asc";
			queryObjCategory.user_id = req.user.id;
			queryObjCategory.address_type = addressCode.BILLINGADDRESS;

			service.findAllRows('Address', includeArr, queryObjCategory, offset, limit, field, order)
				.then(function(billingAddressdetails) {
					var billingAddressdetails = billingAddressdetails.rows;
					return callback(null, billingAddressdetails);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		unreadCounts: function(callback) {
			notifictionService.notificationCounts(LoggedInUser.id)
				.then(function(counts) {
					return callback(null, counts);
				}).catch(function(error) {
					return callback(null);
				});
		}
	}, function(err, results) {
		if (!err) {
			res.render('userNav/billing-settings', {
				title: "Global Trade Connect",
				LoggedInUser: LoggedInUser,
				categories: results.categories,
				billingAddress: results.billingAddress,
				cards: results.cards,
				unreadCounts: results.unreadCounts,
				bottomCategory: bottomCategory,
				cart: results.cartInfo,
				marketPlace: marketplace,
				selectedPage: 'billing-settings',
				vendorPlan: vendorPlan,
				payPalOAuthUrl: payPalOAuthUrl,
				stripePublishableKey: config.stripeConfig.keyPublishable
			});
		} else {
			res.render('userNav/billing-settings', err);
		}
	});
}