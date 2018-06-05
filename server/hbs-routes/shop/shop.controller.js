'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const position = require('../../config/position');
const service = require('../../api/service');

const async = require('async');
import series from 'async/series';

export function shop(req, res) {

    var productModel = "MarketplaceProduct";
    var vendorModel = "VendorUserProduct";
	var offset, limit, field, order;
    var queryObj = {};
    var LoggedInUser = {}

    if(req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable)
        LoggedInUser = req.gtcGlobalUserObj;

	offset = 0;
	field = "id";
	order = "asc";

    queryObj['status'] = status["ACTIVE"];
    queryObj['marketplace_id'] = 2;

    async.series({
        featuredProducts: function (callback) {
            limit = null;
            queryObj['featured_position'] = position.ShopLanding;
            queryObj['is_featured_product'] = 1;

            console.log("queryObj",queryObj);

            service.findRows(productModel, queryObj, offset, limit, field, order)
                .then(function (featuredProducts) {
                    console.log("featuredProducts",featuredProducts);
                    return callback(null, featuredProducts.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        publicMarketplace: function (callback) {
            limit = 20;
            delete queryObj['featured_position'];
            delete queryObj['is_featured_product'];
            service.findRows(productModel, queryObj, offset, limit, field, order)
                .then(function (publicMarketplace) {
                    return callback(null, publicMarketplace.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        retailers: function (callback) {
            delete queryObj['marketplace_id'];
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
        }
    }, function (err, results) {
        if (!err) {
            res.render('shop', {
				title: "Global Trade Connect",
				featuredProducts: results.featuredProducts,
				publicMarketplace: results.publicMarketplace,
                retailers: results.retailers,
                LoggedInUser: LoggedInUser
			});
        }
        else {
            res.render('shop', err);
        }
    });

}