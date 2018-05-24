'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');

const async = require('async');
import series from 'async/series';

export function shop(req, res) {

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
    queryObj['marketplace'] = 'Public Marketplace';

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
        publicMarketplace: function (callback) {

            service.findRows(productModel, queryObj, offset, limit, field, order)
                .then(function (publicMarketplace) {
                    return callback(null, publicMarketplace.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        retailers: function (callback) {
            delete queryObj['marketplace'];
            queryObj['type'] = 'Public Marketplace';
            field = 'sales_count';
            order = 'desc';
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
				retailers: results.retailers
			});
        }
        else {
            res.render('shop', err);
        }
    });

}