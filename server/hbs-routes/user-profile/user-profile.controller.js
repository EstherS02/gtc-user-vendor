'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const addressCode = require('../../config/address');
const service = require('../../api/service');
const async = require('async');
const populate = require('../../utilities/populate');
const vendorPlan = require('../../config/gtc-plan');

export function userProfile(req, res) {

	var vendorModel = "Vendor";
	var UserModel = "User"
	var addressModel= "Address";
	var countryModel = "Country";
	var vendorIncludeArr= [];
	var addressIncludeArr= [];

	vendorIncludeArr = populate.populateData('User');
	addressIncludeArr = populate.populateData('Country,State');

	var offset, limit, field, order;
	var queryObj = {}, LoggedInUser = {};

	
	offset = 0;
    limit = null;
    field = "id";
	order = "asc";
	
	if(req.user)
		LoggedInUser = req.user;
		let user_id = LoggedInUser.id;


	async.series({
		vendor: function (callback) {
			service.findOneRow(vendorModel, { user_id:user_id }, vendorIncludeArr)
				.then(function (vendor) {
					return callback(null, vendor);
				}).catch(function (error) {
					return callback(null);
				});
		},
		user:function (callback) {
			service.findOneRow(UserModel, { id:user_id })
				.then(function (user) {
					console.log("user",user);
					return callback(null, user);
				}).catch(function (error) {
					return callback(null);
				});
		},
		shippingAddress: function (callback) {
			service.findOneRow(addressModel, {user_id:user_id, address_type: addressCode['SHIPPINGADDRESS']}, addressIncludeArr)
				.then(function (shippingAddress) {
					return callback(null, shippingAddress);
				}).catch(function (error) {
					return callback(null);
				});
		},
		billingAddress: function (callback) {
			service.findOneRow(addressModel, {user_id:user_id, address_type: addressCode['BILLINGADDRESS']},addressIncludeArr) 
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
			res.render('userNav/user-profile', {
				title: "Global Trade Connect",
				vendor:results.vendor,
				user:results.user,
				shippingAddress:results.shippingAddress,
				billingAddress:results.billingAddress,
				country: results.country,
				LoggedInUser: LoggedInUser,
				selectedPage:'user-profile',
				vendorPlan:vendorPlan
			});
		} else {
			res.render('userNav/user-profile', err);
		}
	});
}