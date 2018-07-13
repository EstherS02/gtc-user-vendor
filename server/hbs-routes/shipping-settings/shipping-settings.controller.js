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

export function shippingSettings(req, res) {
	var LoggedInUser = {};

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;
	var vendor_id = req.user.Vendor.id;
	var modelName = 'Country';
	var queryObj = {
		status: 1,
		vendor_id: vendor_id
	};
	var vendorModelName = "VendorShippingLocation";

	async.series({
			Countries: function(callback) {
				service.findRows(modelName, {}, 0, null, 'id', 'desc', [])
					.then(function(results) {
						return callback(null, results);
					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(null);
					});
			},
			vendorCountries: function(callback) {
				service.findRows(vendorModelName, queryObj, 0, null, 'id', 'desc', [])
					.then(function(results) {
						var vendorCountriesID = [];
					if (results.rows.length > 0) {
						for (var i = 0; i < results.rows.length; i++) {
							vendorCountriesID.push(results.rows[i].country_id);
						}
						return callback(null, vendorCountriesID);
					} else {
						return callback(null, vendorCountriesID);
					}
						return callback(null, results);
					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(null);
					});
			}
		},
		function(err, results) {
			console.log(results.vendorCountries)
			if (!err) {
				res.render('shipping-settings', {
					title: "Global Trade Connect",
					Countries: results.Countries.rows,
					LoggedInUser:LoggedInUser,
					vendorCountry:results.vendorCountries,
					selectedPage:'shipping-settings',
					vendorPlan:vendorPlan
				});
			} else {
				res.render('shipping-settings', err);
			}
		});

}