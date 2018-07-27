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
    var bottomCategory ={};

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
		cartCounts: function(callback) {
            service.cartHeader(LoggedInUser).then(function(response) {
                return callback(null, response);
            }).catch(function(error) {
                console.log('Error :::', error);
                return callback(null);
            });
        },
			Countries: function(callback) {
				service.findRows(modelName, {}, 0, null, 'id', 'asc', [])
					.then(function(results) {
						return callback(null, results);
					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(null);
					});
			},
			vendorCountries: function(callback) {
				service.findRows(vendorModelName, queryObj, 0, null, 'country_id', 'asc', [])
					.then(function(results) {
						var vendorCountriesID = [];
						var vendorCountries = {};
					if (results.rows.length > 0) {
						for (var i = 0; i < results.rows.length; i++) {
							vendorCountriesID.push(results.rows[i].country_id);
						}
						vendorCountries.vendorCountriesID = vendorCountriesID;
						vendorCountries.count = results.count;
						return callback(null, vendorCountries);
					} else {
						return callback(null, vendorCountriesID);
					}
						return callback(null, results);
					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(null);
					});
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

        }
		},
		function(err, results) {
			// console.log(results.vendorCountries)
			if (!err) {
				res.render('vendorNav/shipping-settings', {
					title: "Global Trade Connect",
					Countries: results.Countries,
					LoggedInUser:LoggedInUser,
					categories: results.categories,
                	bottomCategory: bottomCategory,
                	cartheader: results.cartCounts,
					vendorCountry:results.vendorCountries,
					selectedPage:"shipping-settings",
					vendorPlan:vendorPlan
				});
			} else {
				res.render('vendorNav/shipping-settings', err);
			}
		});

}