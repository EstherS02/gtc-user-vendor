'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const RawQueries = require('../../raw-queries/sql-queries');
const moment = require('moment');
var async = require('async');
const _ = require('lodash');


export function geoLocate(req, res) {
    var LoggedInUser = {};
    var bottomCategory = {};

    if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable)
        LoggedInUser = req.gtcGlobalUserObj;

    async.series({
            cartCounts: function(callback) {
                service.cartHeader(LoggedInUser).then(function(response) {
                    return callback(null, response);
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
            },
            geoLocateQuery: function(callback){
                let lat = 13.07895029;
                let lng = 80.1807242;

                service.geoLocationFetch(lat, lng).then(function(geoLocationResp) {
                    return callback(null, geoLocationResp);
                }).catch(function(error) {
                    console.log('Error :::', error);
                    return callback(error);
                });
            },
            categoriesWithCount: function(callback) {
                var categoryQueryObj = {};
                var productCountQueryParames = {};
    
                categoryQueryObj['status'] = statusCode["ACTIVE"];
                productCountQueryParames['status'] = statusCode["ACTIVE"];
               /*  if (vendor_id) {
                    productCountQueryParames['vendor_id'] = vendor_id;
                } */
            /*     if (req.query.marketplace_type) {
                    productCountQueryParames['marketplace_type_id'] = req.query.marketplace_type;
                }
                if (req.query.location) {
                    productCountQueryParames['product_location'] = req.query.location;
                }
                if (req.query.keyword) {
                    productCountQueryParames['product_name'] = {
                        like: '%' + req.query.keyword + '%'
                    };
                } */
                service.getCategory(categoryQueryObj, productCountQueryParames)
                    .then(function(response) {
                        return callback(null, JSON.parse(JSON.stringify(response)));
                    }).catch(function(error) {
                        console.log('Error :::', error);
                        return callback(null);
                    });
            }
        },
        function(err, results) {
            if (!err) {
               let geoLocateByVendor = _.groupBy(results.geoLocateQuery, "vendor_id");
               
                 res.render('geo-locate', {
                    title: "Global Trade Connect",
                    categories: results.categories,
                    bottomCategory: bottomCategory,
                    cartheader: results.cartCounts,
                    geoLocateObj: results.geoLocateQuery,
                    geoLocateByVendor: geoLocateByVendor,
                    categoriesWithCount: results.categoriesWithCount,
                    LoggedInUser: LoggedInUser
                });
            } else {
                res.render('wishlist', err);
            }
        });
}