'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const position = require('../../config/position');
const service = require('../../api/service');

const async = require('async');
import series from 'async/series';

export function wholeSaleProductView(req, res) {
    console.log('productSlugName', req.params.productSlugName);
    console.log('marketPlaceType', req.params.marketPlaceType);
    res.render('product-view', {
        title: "Global Trade Connect"
    });
}

export function wholesale(req, res) {
    var productModel = "ProductSalesRating";
    var featuredProductModel = "FeaturedproductSalesRating";
    var vendorModel = "VendorUserProduct";
    var categoryModel = "Category";
    var countryModel = "Country";
    var offset, limit, field, order;
    var queryObj = {};
    var LoggedInUser = {}

    if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable)
        LoggedInUser = req.gtcGlobalUserObj;

    offset = 0;
    limit = 20;
    field = "id";
    order = "asc";

    queryObj['status'] = status["ACTIVE"];

    async.series({
        wantToSell: function(callback) {
            queryObj['marketplace_type'] = 'Want To Sell';
            service.findRows(productModel, queryObj, offset, limit, field, order)
                .then(function(wantToSell) {
                    return callback(null, wantToSell.rows);

                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        wantToBuy: function(callback) {
            queryObj['marketplace_type'] = 'Want To Buy';
            service.findRows(productModel, queryObj, offset, limit, field, order)
                .then(function(wantToBuy) {
                    return callback(null, wantToBuy.rows);

                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        wantToTrade: function(callback) {
            queryObj['marketplace_type'] = 'Want To Trade';
            service.findRows(productModel, queryObj, offset, limit, field, order)
                .then(function(wantToTrade) {
                    return callback(null, wantToTrade.rows);

                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        requestForQuote: function(callback) {
            queryObj['marketplace_type'] = 'Request For Quote';
            service.findRows(productModel, queryObj, offset, limit, field, order)
                .then(function(requestForQuote) {
                    return callback(null, requestForQuote.rows);

                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        featuredProducts: function(callback) {
            limit = null;
            delete queryObj['marketplace_type'];
            queryObj['position'] = position.WholesaleLanding;
            queryObj['marketplace'] = 'Private Wholesale Marketplace';
            service.findRows(featuredProductModel, queryObj, offset, limit, field, order)
                .then(function(featuredProducts) {
                    return callback(null, featuredProducts.rows);

                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        category: function(callback) {
            limit = null;
            delete queryObj['marketplace'];
            delete queryObj['position'];
            service.findRows(categoryModel, queryObj, offset, limit, field, order)
                .then(function(category) {
                    return callback(null, category.rows);

                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        country: function(callback) {
            limit = null;
            service.findRows(countryModel, queryObj, offset, limit, field, order)
                .then(function(country) {
                    return callback(null, country.rows);

                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        wholesalers: function(callback) {
            delete queryObj['marketplace'];
            queryObj['type'] = 'Private Wholesale Marketplace';
            field = 'sales_count';
            order = 'desc';
            limit = 6;
            service.findRows(vendorModel, queryObj, offset, limit, field, order)
                .then(function(wholesalers) {
                    return callback(null, wholesalers.rows);

                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
    }, function(err, results) {
        if (!err) {
            res.render('wholesale', {
                title: "Global Trade Connect",
                wantToSell: results.wantToSell,
                wantToBuy: results.wantToBuy,
                wantToTrade: results.wantToTrade,
                requestForQuote: results.requestForQuote,
                featuredProducts: results.featuredProducts,
                wholesalers: results.wholesalers,
                category: results.category,
                country: results.country,
                LoggedInUser: LoggedInUser
            });
        } else {
            res.render('wholesale', err);
        }
    });

}