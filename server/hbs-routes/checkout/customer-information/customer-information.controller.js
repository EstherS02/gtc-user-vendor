'use strict';

const async = require('async');
const _ = require('lodash');
const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const status = require('../../../config/status');
const service = require('../../../api/service');
const populate = require('../../../utilities/populate');
const marketplace = require('../../../config/marketplace');
const cartService = require('../../../api/cart/cart.service');
const ADDRESS_TYPE = require('../../../config/address');
const querystring = require('querystring');

function processCheckout(req, res, callback) {
	var bottomCategory = {};
	const LoggedInUser = req.user;

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
		address: function(cb) {
			let searchObj = {};
			let includeArr = [];

			includeArr = [{
				"model": model["User"],
				attributes: {
					exclude: ['hashed_pwd', 'salt', 'email_verified_token', 'email_verified_token_generated', 'forgot_password_token', 'forgot_password_token_generated']
				}
			}, {
				"model": model["Country"]
			}, {
				"model": model["State"]
			}];

			searchObj['status'] = {
				'$eq': status["ACTIVE"]
			}
			searchObj['user_id'] = LoggedInUser.id;

			return service.findRows('Address', searchObj, null, null, 'address_type', "asc", includeArr)
				.then(function(addressData) {
					addressData = JSON.parse(JSON.stringify(addressData));
					return cb(null, addressData.rows)
				}).catch(function(error) {
					console.log('Error :::', error);
					return cb(error);
				});
		},
		country: function(cb) {
			let searchObj = {};
			let includeArr = [];

			searchObj['status'] = {
				'$eq': status["ACTIVE"]
			}

			return service.findRows('Country', searchObj, null, null, 'name', "asc", includeArr)
				.then(function(countryData) {
					countryData = JSON.parse(JSON.stringify(countryData));
					return cb(null, countryData.rows)
				}).catch(function(error) {
					console.log('Error :::', error);
					return cb(error);
				});
		},
		state: function(cb) {
			let searchObj = {};
			let includeArr = [];

			includeArr = populate.populateData("Country");
			searchObj['status'] = {
				'$eq': status["ACTIVE"]
			}

			return service.findRows('State', searchObj, null, null, 'name', "asc", includeArr)
				.then(function(stateData) {
					stateData = JSON.parse(JSON.stringify(stateData));
					return cb(null, stateData.rows)
				}).catch(function(error) {
					console.log('Error :::', error);
					return cb(error);
				});
		},
		categories: function(cb) {
			var includeArr = [];
			const categoryOffset = 0;
			const categoryLimit = null;
			const categoryField = "id";
			const categoryOrder = "asc";
			var categoryModel = "Category";
			const categoryQueryObj = {};

			categoryQueryObj['status'] = status["ACTIVE"];

			service.findAllRows(categoryModel, includeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
				.then(function(category) {
					var categories = category.rows;
					bottomCategory['left'] = categories.slice(0, 8);
					bottomCategory['right'] = categories.slice(8, 16);
					return cb(null, category.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return cb(null);
				});
		},
		cards: function(callback) {
			var includeArr = [];
			const offset = 0;
			const limit = null;
			const field = "id";
			const order = "asc";
			var queryObjCategory = {};
			queryObjCategory.user_id = req.user.id;
			queryObjCategory.status = status.ACTIVE;

			service.findAllRows('PaymentSetting', includeArr, queryObjCategory, offset, limit, field, order)
				.then(function(paymentSetting) {
					return callback(null, paymentSetting.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		}
	}, function(err, results) {
		if (!err) {

			let billing_address = [],
				shipping_address = [];

			let splitAddress = _.groupBy(results.address, "address_type");

			if (splitAddress && splitAddress[ADDRESS_TYPE['BILLINGADDRESS']])
				billing_address = splitAddress[ADDRESS_TYPE['BILLINGADDRESS']];
			if (splitAddress && splitAddress[ADDRESS_TYPE['SHIPPINGADDRESS']])
				shipping_address = splitAddress[ADDRESS_TYPE['SHIPPINGADDRESS']];
			if (splitAddress && splitAddress[ADDRESS_TYPE['BOTH_ADDRESS']])
				shipping_address = splitAddress[ADDRESS_TYPE['BOTH_ADDRESS']];
			if (splitAddress && splitAddress[ADDRESS_TYPE['BOTH_ADDRESS']])
				billing_address = splitAddress[ADDRESS_TYPE['BOTH_ADDRESS']];

			var selected_billing_address;
			var selected_shipping_address;

			if (req.query.selected_billing_address_id) {
				for (let i = 0; i < results.address.length; i++) {
					if (results.address[i].id == req.query.selected_billing_address_id) {
						selected_billing_address = results.address[i];
						break;
					}
				}
			}

			if (req.query.selected_shipping_address_id) {
				for (let i = 0; i < results.address.length; i++) {
					if (results.address[i].id == req.query.selected_shipping_address_id) {
						selected_shipping_address = results.address[i];
						break;
					}
				}
			}

			var result_obj = {
				title: "Global Trade Connect",
				LoggedInUser: LoggedInUser,
				cart: results.cartInfo,
				marketPlace: marketplace,
				billing_address: billing_address,
				shipping_address: shipping_address,
				state: results.state,
				country: results.country,
				categories: results.categories,
				bottomCategory: bottomCategory,
				selected_billing_address: selected_billing_address,
				selected_shipping_address: selected_shipping_address,
				query_params: querystring.stringify(req.query),
				cards: results.cards,
				stripePublishableKey: config.stripeConfig.keyPublishable
			};
			callback(result_obj);
		} else {
			callback(null, err);
		}
	});
}

export function customerInformation(req, res) {
	processCheckout(req, res, function(obj, err) {
		if (err) {
			return res.status(500).render(err);
		} else {
			if (obj.cart.total_items > 0) {
				return showPage(res, 200, 'checkout/customer-information', obj);
			} else {
				return res.redirect('/cart');
			}
		}
	});
}

export function shippingMethod(req, res) {
	processCheckout(req, res, function(obj, err) {
		if (err) {
			return res.status(500).render(err);
		} else {
			if (obj.cart.total_items > 0) {
				if ((req.query.selected_billing_address_id && (Object.keys(obj.selected_billing_address).length > 0)) && (req.query.selected_shipping_address_id && (Object.keys(obj.selected_shipping_address).length > 0))) {
					return showPage(res, 200, 'checkout/shipping-method', obj);
				} else {
					return res.redirect('/order-checkout/customer-information');
				}
			} else {
				return res.redirect('/cart');
			}
		}
	});
}

export function paymentMethod(req, res) {
	processCheckout(req, res, function(obj, err) {
		if (err) {
			return res.status(500).render(err);
		} else {
			if (obj.cart.total_items > 0) {
				if ((req.query.selected_billing_address_id && (Object.keys(obj.selected_billing_address).length > 0)) && (req.query.selected_shipping_address_id && (Object.keys(obj.selected_shipping_address).length > 0))) {
					return showPage(res, 200, 'checkout/payment-method', obj);
				} else {
					return res.redirect('/order-checkout/customer-information');
				}
			} else {
				return res.redirect('/cart');
			}
		}
	});
}

function showPage(res, status, page, obj) {
	res.status(status).render(page, obj);
}