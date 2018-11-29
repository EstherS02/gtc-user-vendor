import {
	exists
} from 'fs';
import jsonpatch from 'fast-json-patch';

'use strict';

const async = require('async');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
const status = require('../../config/status');
const discount = require('../../config/discount');
const _ = require('lodash');
const moment = require('moment');
const ADDRESS_TYPE = require('../../config/address');

export function addCustomerInformation(req, res) {

	var billing_address_id;
	var shipping_address_id;

	processBillingAddress(req)
		.then(billing_address_id_result => {
			billing_address_id = billing_address_id_result;
			return processShippingAddress(req, billing_address_id);
		}).then(shipping_address_id_result => {
			shipping_address_id = shipping_address_id_result;
			return res.status(200).send({
				billing_address_id: billing_address_id,
				shipping_address_id: shipping_address_id
			});
		}).catch(err => {
			return res.status(500).send(err);
		});
}

function processBillingAddress(req) {
	return new Promise((resolve, reject) => {
		if (req.body.billing_address_select_id) {
			resolve(req.body.billing_address_select_id);
		} else if (req.body.billing_address_id) {
			resolve(req.body.billing_address_id);
		} else {
			validateBillingAddress(req);
			let errors = req.validationErrors();
			if (errors) {
				reject(errors);
			} else {
				var billing_address = {
					user_id: req.user.id,
					address_type: ADDRESS_TYPE['BILLINGADDRESS'],
					first_name: req.body.billing_first_name,
					last_name: req.body.billing_last_name,
					company_name: req.body.billing_company_name,
					address_line1: req.body.billing_addressline1,
					address_line2: req.body.billing_addressline2,
					province_id: req.body.billing_state,
					country_id: req.body.billing_country,
					city: req.body.billing_city,
					postal_code: req.body.billing_postal,
					phone: req.body.billing_phone,
					status: status['ACTIVE'],
					created_by: req.user.first_name,
					created_on: new Date()
				};
				service.createRow('Address', billing_address).then(address => {
					resolve(address.id);
				}).catch(err => {
					reject(err);
				});
			}
		}
	});
}

function processShippingAddress(req, billing_address_id) {
	var addressModelName = 'Address';
	return new Promise((resolve, reject) => {
		if (req.body.different_shipping_address == "on") {
			if (req.body.shipping_address_select_id) {
				service.findIdRow(addressModelName, req.body.shipping_address_select_id)
					.then(function(response) {
						if (!response && response != null) {
							validateShippingCountry(req.user.id, response.country_id)
						} else {
							return reject([{
								msg: "Shipping Country is Not Exists",
								param: "shipping_country"
							}]);
						}
					}).catch(function(err) {
						return reject(err);
					});
			} else if (req.body.shipping_address_id) {
				service.findIdRow(addressModelName, req.body.shipping_address_id)
					.then(function(response) {
						if (!response && response != null) {
							validateShippingCountry(req.user.id, response.country_id)
						} else {
							return reject([{
								msg: "Shipping Country is Not Exists",
								param: "shipping_country"
							}]);
						}
					}).catch(function(err) {
						return reject(err);
					});
			} else {
				validateShippingAddress(req);
				let errors = req.validationErrors();
				if (errors) {
					return reject(errors);
				} else {
					validateShippingCountry(req.user.id, req.body.shipping_country)
						.then((response) => {
							var shipping_address = {
								user_id: req.user.id,
								address_type: ADDRESS_TYPE['SHIPPINGADDRESS'],
								first_name: req.body.shipping_first_name,
								last_name: req.body.shipping_last_name,
								company_name: req.body.shipping_company_name,
								address_line1: req.body.shipping_addressline1,
								address_line2: req.body.shipping_addressline2,
								province_id: req.body.shipping_state,
								country_id: req.body.shipping_country,
								city: req.body.shipping_city,
								postal_code: req.body.shipping_postal,
								phone: req.body.shipping_phone,
								status: status['ACTIVE'],
								created_by: req.user.first_name,
								created_on: new Date()
							};
							return service.createRow('Address', shipping_address);
						}).then((address) => {
							return resolve(address.id);
						}).catch((error) => {
							return reject(error);
						});
				}
			}
		} else {
			return resolve(billing_address_id);
		}
	});
}

function validateBillingAddress(req) {
	req.checkBody('billing_first_name', 'Billing Address First Name is Required').notEmpty();
	req.checkBody('billing_last_name', 'Billing Address Last Name is Required').notEmpty();
	req.checkBody('billing_addressline1', 'Billing Address Line 1 is Required').notEmpty();
	req.checkBody('billing_city', 'Billing Address City is Required').notEmpty();
	req.checkBody('billing_country', 'Billing Address Country is Required').notEmpty();
	req.checkBody('billing_state', 'Billing Address State is Required').notEmpty();
	req.checkBody('billing_postal', 'Billing Address Postal code is Required').notEmpty();
	req.checkBody('billing_phone', 'Billing Address Phone Number is Required').notEmpty();
	return;
}

function validateShippingAddress(req) {
	req.checkBody('shipping_first_name', 'Shipping Address First Name is Required').notEmpty();
	req.checkBody('shipping_last_name', 'Shipping Address Last Name is Required').notEmpty();
	req.checkBody('shipping_addressline1', 'Shipping Address Line 1 is Required').notEmpty();
	req.checkBody('shipping_city', 'Shipping Address City is Required').notEmpty();
	req.checkBody('shipping_country', 'Shipping Address Country is Required').notEmpty();
	req.checkBody('shipping_state', 'Shipping Address State is Required').notEmpty();
	req.checkBody('shipping_postal', 'Shipping Address Postal code is Required').notEmpty();
	req.checkBody('shipping_phone', 'Shipping Address Phone Number is Required').notEmpty();
	return;
}

function validateShippingCountry(userId, countryId) {
	console.log("userId", "countryId", userId, countryId);
	var queryObj = {};
	var includeArr = [];
	var validationArray = [];
	const cartModelName = "Cart";
	const vendorShippingLocationModelName = "VendorShippingLocation";

	queryObj['user_id'] = userId;
	queryObj['status'] = status["ACTIVE"];

	includeArr = [{
		model: model["Product"],
		attributes: ['id', 'product_name', 'vendor_id']
	}];

	return new Promise(async (resolve, reject) => {
		const cartResponse = await service.findAllRows(cartModelName, includeArr, queryObj, 0, null, 'id', 'ASC');
		if (cartResponse.count > 0) {
			for (let cartProduct of cartResponse.rows) {
				var queryObject = {};

				queryObject['vendor_id'] = cartProduct.Product.vendor_id;
				queryObject['country_id'] = countryId;
				queryObject['status'] = status["ACTIVE"];

				const exists = await service.findOneRow(vendorShippingLocationModelName, queryObject);
				if (!exists && exists != null) {
					validationArray.push({
						msg: cartProduct.Product.product_name.substring(0, 100) + "... is Not Available To Ship Your Country",
						param: "shipping_country"
					});
				}
			}
			if (validationArray.length > 0) {
				return reject(validationArray);
			} else {
				return resolve(true);
			}
		} else {
			return resolve(true);
		}
	});
}