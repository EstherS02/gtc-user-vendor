'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');

const async = require('async');
import series from 'async/series';

export function lifestyle(req, res) {
    var productModel = "ProductSalesRating";
    var featuredProductModel = "FeaturedproductSalesRating";
    var vendorModel = "VendorUserProduct";
    var offset, limit, field, order;
    var queryObj = {};

    offset = 0;
    limit = 5;
    field = "id";
    order = "asc";

    queryObj['status'] = status["ACTIVE"];
    queryObj['marketplace'] = 'Lifestyle Marketplace';

    async.series({
        featuredProducts: function (callback) {
            service.findRows(featuredProductModel, queryObj, offset, limit, field, order)
                .then(function (featuredProducts) {
                    return callback(null, featuredProducts.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        lifestyle: function (callback) {
            service.findRows(productModel, queryObj, offset, 20, field, order)
                .then(function (lifestyle) {
                    return callback(null, lifestyle.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        subscriptionProviders: function (callback) {
            delete queryObj['marketplace'];
            queryObj['type'] = 'Lifestyle Marketplace';
            field = 'sales_count';
            order = 'desc';
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
            res.render('lifestyle', {
                title: "Global Trade Connect",
                featuredProducts: results.featuredProducts,
                lifestyle: results.lifestyle
            });
        }
        else {
            res.render('lifestyle', err);
        }
    });
}









