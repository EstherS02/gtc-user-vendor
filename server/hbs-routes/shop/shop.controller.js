'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');

const async = require('async');
import series from 'async/series';

export function shop(req, res) {

    var field = "id";
    var order = "desc";

    async.series({
        featuredProducts: function (callback) {

            service.findRows('FeaturedproductSalesRating', { status: 1, marketplace: 'Public Marketplace' }, 0, 4, field, order)
                .then(function (featuredProducts) {
                    return callback(null, featuredProducts.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        publicMarketplace: function (callback) {

            service.findRows('ProductSalesRating', { status: 1, marketplace: 'Public Marketplace' }, 0, 20, field, order)
                .then(function (publicMarketplace) {
                    return callback(null, publicMarketplace.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        }
    }, function (err, results) {
        if (!err) {
            res.render('shop', results);
        }
        else {
            res.render('shop', err);
        }
    });

}