'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');
var async = require('async');
const vendorPlan = require('../../config/gtc-plan');
const paypal = require('paypal-rest-sdk');
const cartService = require('../../api/cart/cart.service');
const marketplace = require('../../config/marketplace');

let openIdConnect = paypal.openIdConnect;

paypal.configure({
	'mode': config.payPalOAuth.payPalMode,
	'openid_client_id': config.payPalOAuth.clientId,
	'openid_client_secret': config.payPalOAuth.clientSecret,
	'openid_redirect_uri': config.payPalOAuth.redirectUrl
});

export function paymentSettings(req, res) {

	var LoggedInUser = {},
		bottomCategory = {},
		vendorQueryObj = {};
	var vendorIncludeArr = [];
	var offset, limit, field, order, connectUrl;

	offset = 0;
	field = "id";
	order = "asc";
	limit = 6;

	var currencyModel = 'Currency';
	var vendorModel = 'Vendor';

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;

	vendorQueryObj['user_id'] = user_id;

	vendorIncludeArr = [{
		"model": model['Currency'],
		atrribute: ['id', 'name']
	}]

	connectUrl = config.stripeConfig.connectUrl;
	let payPalOAuthUrl = openIdConnect.authorizeUrl({
		'scope': config.payPalOAuth.scope
	});

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
				var categoryModel = "Category";
				const categoryQueryObj = {};

				categoryQueryObj['status'] = statusCode["ACTIVE"];

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
			currency: function(callback) {
				service.findRows(currencyModel, {}, offset, limit, field, order)
					.then(function(currency) {
						return callback(null, currency.rows);

					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(null);
					});
			},
			vendorPaymentInfo: function(callback) {
				service.findOneRow(vendorModel, vendorQueryObj, vendorIncludeArr)
					.then(function(vendor) {
						return callback(null, vendor);
					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(null);
					});
			}

		},
		function(err, results) {
			console.log(results)
			if (!err) {
				res.render('vendorNav/payment-settings', {
					title: "Global Trade Connect",
					LoggedInUser: LoggedInUser,
					categories: results.categories,
					bottomCategory: bottomCategory,
					selectedPage: 'payment-settings',
					cart: results.cartInfo,
					marketPlace: marketplace,
					vendorPlan: vendorPlan,
					currency: results.currency,
					vendorPaymentInfo: results.vendorPaymentInfo,
					connectUrl: connectUrl,
					payPalOAuthUrl: payPalOAuthUrl,
					statusCode: statusCode
				});
			} else {
				res.render('vendorNav/payment-settings', err);
			}
		});
}