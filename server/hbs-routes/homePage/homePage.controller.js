'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');
import series from 'async/series';
var async = require('async');


export function homePage(req, res) {

    var field = "id";
    var order = "asc";

    async.series({
        wantToSell: function (callback) {

            service.findRows('ProductSalesRating', { marketplace_type: 'Want To Sell' }, 0, 5, field, order)
                .then(function (wantToSell) {
                    return callback(null, wantToSell.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        wantToBuy: function (callback) {

            service.findRows('ProductSalesRating', { marketplace_type: 'Want To Buy' }, 0, 5, field, order)
                .then(function (wantToBuy) {
                    return callback(null, wantToBuy.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        wantToTrade: function (callback) {

            service.findRows('ProductSalesRating', { marketplace_type: 'Want To Trade' }, 0, 5, field, order)
                .then(function (wantToTrade) {
                    return callback(null, wantToTrade.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        requestForQuote: function (callback) {

            service.findRows('ProductSalesRating', { marketplace_type: 'Request For Quote' }, 0, 5, field, order)
                .then(function (requestForQuote) {
                    return callback(null, requestForQuote.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        publicMarketplace: function (callback) {

            service.findRows('ProductSalesRating', { marketplace: 'Public Marketplace' }, 0, 5, field, order)
                .then(function (publicMarketplace) {
                    return callback(null, publicMarketplace.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        serviceMarketplace: function (callback) {

            service.findRows('ProductSalesRating', { marketplace: 'Service Marketplace' }, 0, 5, field, order)
                .then(function (serviceMarketplace) {
                    return callback(null, serviceMarketplace.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        lifestyleMarketplace: function (callback) {

            service.findRows('ProductSalesRating', { marketplace: 'Lifestyle Marketplace' }, 0, 5, field, order)
                .then(function (lifestyleMarketplace) {
                    return callback(null, lifestyleMarketplace.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        featuredProducts: function (callback) {

            service.findRows('FeaturedproductSalesRating', { }, 0, 5, field, order)
                .then(function (featuredProducts) {
                    return callback(null, featuredProducts.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        }

    }, function (err, results) {
        if (!err) {
            res.render('homePage', results);
        }
        else {
            res.render('homePage', err);
        }
    });

}
