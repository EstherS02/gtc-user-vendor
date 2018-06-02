'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');
const async = require('async');

export function directory(req, res) {
    var categoryModel = "Category";
    var subcategoryModel = "SubCategory";
    var countryModel = "Country";
    var vendorModel = "VendorUserProduct";
    var offset, limit, field, order;
    var queryObj = {};
    var LoggedInUser = {};

	if(req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable)
		LoggedInUser = req.gtcGlobalUserObj;

    offset = 0;
    field = "id";
    order = "asc";

    queryObj['status'] = status["ACTIVE"];

    async.series({
        category: function (callback) {
            limit=10;
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
        },
        wholesalers: function (callback) {
            queryObj['type'] = 'Private Wholesale Marketplace';
            field = 'sales_count';
            order = 'desc';
            limit = 6;
            service.findRows(vendorModel, queryObj, offset, limit, field, order)
                .then(function (wholesalers) {
                    return callback(null, wholesalers.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        retailers: function (callback) {
            queryObj['type'] = 'Public Marketplace';
            field = 'sales_count';
            order = 'desc';
            limit = 6;
            service.findRows(vendorModel, queryObj, offset, limit, field, order)
                .then(function (retailers) {
                    return callback(null, retailers.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        servicesProviders: function (callback) {
            queryObj['type'] = 'Services Marketplace';
            field = 'sales_count';
            order = 'desc';
            limit = 6;
            service.findRows(vendorModel, queryObj, offset, limit, field, order)
                .then(function (servicesProviders) {
                    return callback(null, servicesProviders.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        subscriptionProviders: function (callback) {
            queryObj['type'] = 'Lifestyle Marketplace';
            field = 'sales_count';
            order = 'desc';
            limit = 6;
            service.findRows(vendorModel, queryObj, offset, limit, field, order)
                .then(function (subscriptionProviders) {
                    return callback(null, subscriptionProviders.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        }
    }, function (err, results) {
        if (!err) {
            res.render('directory', {
                title: "Global Trade Connect",
                category: results.category,
                subCategory: results.subCategory,
                country: results.country,
                wholesalers: results.wholesalers,
                retailers: results.retailers,
                servicesProviders: results.servicesProviders,
                subscriptionProviders: results.subscriptionProviders,
                LoggedInUser: LoggedInUser
            });
        }
        else {
            res.render('directory', err);
        }
    });
}
