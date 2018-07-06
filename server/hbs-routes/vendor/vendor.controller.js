'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const position = require('../../config/position');
const status = require('../../config/status');
const service = require('../../api/service');
const sequelize = require('sequelize');
const marketplace = require('../../config/marketplace');
const marketplace_type = require('../../config/marketplace_type');
const moment = require('moment');
import series from 'async/series';
var async = require('async');

export function vendor(req, res) {
	var LoggedInUser = {};

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;

	var productModel = "MarketplaceProduct";
	// var vendorModel = "VendorUserProduct";
	// var categoryModel = "Category";
	var offset=0;
	var limit;
	var field="id";
	var order = "desc"
	var queryObj = {};
	var vendor_id = req.params.id;
	// queryObj['marketplace_id'] = marketplace['PUBLIC'];
	queryObj['vendor_id'] = vendor_id;

	async.series({
		featuredProducts: function(callback) {
            // queryObj['featured_position'] = position.SignUp;
            queryObj['is_featured_product'] = 1;
            limit = 1;
            service.findRows(productModel, queryObj, offset, limit, field, order)
                .then(function(featuredProducts) {
                    return callback(null, featuredProducts.rows);

                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        topSelling: function(callback) {
            delete queryObj['featured_position'];
            delete queryObj['is_featured_product'];

            queryObj['vendor_id'] = vendor_id;
            field = 'product_selling_count';
            order = 'desc';
            limit = 3;
            service.findRows(productModel, queryObj, offset, limit, field, order)
                .then(function(servicesProviders) {
                    return callback(null, servicesProviders.rows);

                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        topRating: function(callback) {
            delete queryObj['featured_position'];
            delete queryObj['is_featured_product'];
            queryObj['vendor_id'] = vendor_id;
            field = 'product_rating';
            order = 'desc';
            limit = 3;
            service.findRows(productModel, queryObj, offset, limit, field, order)
                .then(function(servicesProviders) {
                    return callback(null, servicesProviders.rows);

                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },

		VendorDetail: function(callback) {
		var vendorIncludeArr = [{
				model: model['Country']

			}, {
				model: model['VendorPlan'],

			}, {
				model: model['User'],
				attributes:['id'],
				include: [{
					model: model['VendorVerification'],
					where: {
							vendor_verified_status: status['ACTIVE']
					}
				}]
			}, {
				model: model['VendorFollower'],
				where: {
					user_id: req.user.id,
					status: status['ACTIVE']
				},
				required: false
			}];
			service.findIdRow('Vendor', vendor_id, vendorIncludeArr)
				.then(function(response) {
					return callback(null, response);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
	}, function(err, results) {
		console.log(results.featuredProducts);
		if (!err) {
			res.render('vendor', {
				title: "Global Trade Connect",
				VendorDetail : results.VendorDetail,
				categories: results.categories,
				featuredProducts:results.featuredProducts,
				topSelling:results.topSelling,
				topRating:results.topRating,
				LoggedInUser: LoggedInUser
				// selectedPage:'shop'
			});
		} else {
			res.render('vendor', err);
		}
	});



}