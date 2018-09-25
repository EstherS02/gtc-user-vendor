'use strict';

const async = require('async');
const paypal = require('paypal-rest-sdk');

const config = require('../../config/environment');
const status = require('../../config/status');
const marketplace = require('../../config/marketplace');
const service = require('../../api/service');
const cartService = require('../../api/cart/cart.service');
const vendorPlan = require('../../config/gtc-plan');

let openIdConnect = paypal.openIdConnect;

paypal.configure({
	'mode': config.payPalOAuth.payPalMode,
	'openid_client_id': config.payPalOAuth.clientId,
	'openid_client_secret': config.payPalOAuth.clientSecret,
	'openid_redirect_uri': config.payPalOAuth.redirectUrl
});

export function billingSettings(req, res) {
	var LoggedInUser = {};
	var bottomCategory = {};
	var categoryModel = "Category";
	var paymentSettingModel = "PaymentSetting";
	var billingAddressModel = "Address";

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;

	let payPalOAuthUrl = openIdConnect.authorizeUrl({
		'scope': config.payPalOAuth.scope
	});
	var queryObjCategory = {
		status: status['ACTIVE']
	};

	async.series({
		cartInfo: function(callback) {
			if (LoggedInUser.id) {
				cartService.cartCalculation(LoggedInUser.id)
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
			const categoryOffset = 0;
			const categoryLimit = null;
			const categoryField = "id";
			const categoryOrder = "asc";
			const categoryQueryObj = {};

			categoryQueryObj['status'] = status["ACTIVE"];

			service.findAllRows(categoryModel, includeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
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
			const offset = 0;
			const limit = null;
			const field = "id";
			const order = "asc";
			queryObjCategory.user_id = req.user.id;

			service.findAllRows(paymentSettingModel, includeArr, queryObjCategory, offset, limit, field, order)
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
			const offset = 0;
			const limit = null;
			const field = "id";
			const order = "asc";
			queryObjCategory.user_id = req.user.id;
			queryObjCategory.address_type = 1;

			service.findAllRows(billingAddressModel, includeArr, queryObjCategory, offset, limit, field, order)
				.then(function(billingAddressdetails) {
					var billingAddressdetails = billingAddressdetails.rows;
					return callback(null, billingAddressdetails);
				}).catch(function(error) {
					console.log('Error :::', error);
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