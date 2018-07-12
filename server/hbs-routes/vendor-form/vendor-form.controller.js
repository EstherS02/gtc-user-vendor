'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');
var async = require('async');
const vendorPlan = require('../../config/gtc-plan');

export function vendorForm(req,res){
	var LoggedInUser = {};
	var countryModel = "Country";
	var currencyModel = "Currency";
	var timezoneModel = "Timezone";
	var offset, limit, field, order;
	var queryObj = {},  LoggedInUser = {};
	
	offset = 0;
    limit = null;
    field = "id";
    order = "asc";

	if (req.user)
        LoggedInUser = req.user;
        
        async.series({
			country: function (callback) {
				service.findRows(countryModel, queryObj, offset, limit, field, order)
					.then(function (country) {
						return callback(null, country.rows);
	
					}).catch(function (error) {
						console.log('Error :::', error);
						return callback(null);
					});
			},
			currency: function (callback) {
				service.findRows(currencyModel, queryObj, offset, limit, field, order)
					.then(function (currency) {
						return callback(null, currency.rows);
	
					}).catch(function (error) {
						console.log('Error :::', error);
						return callback(null);
					});
			},
			timezone: function (callback) {
				service.findRows(timezoneModel, queryObj, offset, limit, field, order)
					.then(function (timezone) {
						return callback(null, timezone.rows);
	
					}).catch(function (error) {
						console.log('Error :::', error);
						return callback(null);
					});
			},
           
    }, function(err, results) {
		if (!err) {
			res.render('vendor-form', {
				title: "Global Trade Connect",
				LoggedInUser: LoggedInUser,
				country: results.country,
				currency: results.currency,
				timezone: results.timezone,
				vendorPlan:vendorPlan
			});
		} else {
			res.render('vendor-form', err);
		}
	});


}