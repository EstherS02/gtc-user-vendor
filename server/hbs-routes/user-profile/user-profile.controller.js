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
	var countryModel = "Country";
	var vendorId = 28;
	var userId = 30;
	var vendorIncludeArr= [
		{ model: model['User'] }
	];
	var addressIncludeArr= [
		{ model: model['Country'] },
		{ model: model['State'] }
	];
	var offset, limit, field, order;
    var queryObj = {};
	offset = 0;
    limit = null;
    field = "id";
    order = "asc";

	async.series({
		vendor: function (callback) {
			service.findRow(vendorModel, vendorId, vendorIncludeArr)
				.then(function (vendor) {
					return callback(null, vendor);
				}).catch(function (error) {
					return callback(null);
				});
		},
		shippingAddress: function (callback) {
			service.findOneRow(addressModel, {user_id:userId, address_type: addressCode['SHIPPINGADDRESS'] }, addressIncludeArr)
				.then(function (shippingAddress) {
					return callback(null, shippingAddress);
				}).catch(function (error) {
					return callback(null);
				});
		},
		billingAddress: function (callback) {
			service.findOneRow(addressModel, {user_id:userId, address_type: addressCode['BILLINGADDRESS']},addressIncludeArr) 
				.then(function (billingAddress) {
					return callback(null,billingAddress);
				}).catch(function (error) {
					return callback(null);
				});
		},
		country: function (callback) {
            service.findRows(countryModel, queryObj, offset, limit, field, order)
                .then(function (country) {
                    return callback(null, country.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        }
	}, function (err, results) {
		if (!err) {
			res.render('user-profile', {
				title: "Global Trade Connect",
				vendor:results.vendor,
				shippingAddress:results.shippingAddress,
				billingAddress:results.billingAddress,
				country: results.country
			});
		} else {
			res.render('user-profile', err);
		}
	});
}