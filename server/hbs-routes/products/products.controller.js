'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');
const async = require('async');

export function products(req, res) {
    var productModel = "ProductSalesRating";
    var categoryModel = "Category";
    var subcategoryModel = "SubCategory";
    var countryModel = "Country";
	var offset, limit, field, order;
    var queryObj = {};
    var LoggedInUser = {}

    if(req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable)
        LoggedInUser = req.gtcGlobalUserObj;

	offset = 0;
	limit = 4;
	field = 'sales_count';
	order = 'desc';

	queryObj['status'] = status["ACTIVE"];
	
    async.series({
        wholesalerProducts: function(callback) {
            queryObj['marketplace'] = 'Private Wholesale Marketplace';
            service.findRows(productModel, queryObj, offset, limit, field, order)
                .then(function(wholesalerProducts) {
                    return callback(null, wholesalerProducts.rows);

                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        retailProducts: function(callback) {
            queryObj['marketplace'] = 'Public Marketplace';
            service.findRows(productModel, queryObj, offset, limit, field, order)
                .then(function(retailProducts) {
                    return callback(null, retailProducts.rows);

                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        services: function(callback) {
            queryObj['marketplace'] = 'Services Marketplace';
            service.findRows(productModel, queryObj, offset, limit, field, order)
                .then(function(services) {
                    return callback(null, services.rows);

                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        subscriptions: function(callback) {
            queryObj['marketplace'] = 'Lifestyle Marketplace';
            service.findRows(productModel, queryObj, offset, limit, field, order)
                .then(function(subscriptions) {
                    return callback(null, subscriptions.rows);

                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },  
        category: function (callback) {
            delete queryObj['marketplace'];
            limit = 10;
            order = 'asc';
            field = 'id';
            service.findRows(categoryModel, queryObj, offset, limit, field, order)
                .then(function (category) {
                    return callback(null, category.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        subCategory: function (callback) {
            limit = null;
            service.findRows(subcategoryModel, queryObj, offset, limit, field, order)
                .then(function (subCategory) {
                    return callback(null, subCategory.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
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
             res.render('products', {
                title: "Global Trade Connect",
                wholesalerProducts: results.wholesalerProducts,
                retailProducts: results.retailProducts,
                services: results.services,
                subscriptions: results.subscriptions,
				category: results.category,
                subCategory: results.subCategory,
                country: results.country,
                LoggedInUser: LoggedInUser
			});
        }
        else {
            res.render('products', err);
        }
    });
}
