'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const addressCode = require('../../config/address');
const service = require('../../api/service');
const async = require('async');


export function userProfile(req, res) {
	var vendorModel = "Vendor";
	var addressModel= "Address";
	var vendorId = 28;
	var userId = 30;
	var includeArr= [
		{ model: model['User'] }
	]

	async.series({
		vendor: function (callback) {
			service.findRow(vendorModel, vendorId, includeArr)
				.then(function (vendor) {
					return callback(null, vendor);
				}).catch(function (error) {
					return callback(null);
				});
		},
		shippingAddress: function (callback) {
			service.findOneRow(addressModel, {user_id:userId, address_type: addressCode['SHIPPINGADDRESS'] }, [])
				.then(function (shippingAddress) {
					return callback(null, shippingAddress);
				}).catch(function (error) {
					return callback(null);
				});
		},
		billingAddress: function (callback) {
			service.findOneRow(addressModel, {user_id:userId, address_type: addressCode['BILLINGADDRESS']},[]) 
				.then(function (billingAddress) {
					return callback(null,billingAddress);
				}).catch(function (error) {
					return callback(null);
				});
		}
	}, function (err, results) {
		if (!err) {
			res.render('user-profile', {
				title: "Global Trade Connect",
				vendor:results.vendor,
				shippingAddress:results.shippingAddress,
				billingAddress:results.billingAddress
			});
		} else {
			res.render('user-profile', err);
		}
	});
}