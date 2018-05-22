'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');

const async = require('async');
import series from 'async/series';

export function lifestyle(req, res) {
    var field = "id";
    var order = "desc";

    async.series({
        featuredProducts: function (callback) {

            service.findRows('FeaturedproductSalesRating', { status: 1, marketplace: 'Lifestyle Marketplace' }, 0, 4, field, order)
                .then(function (featuredProducts) {
                    return callback(null, featuredProducts.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        lifestyle: function (callback) {

            service.findRows('ProductSalesRating', { status: 1, marketplace: 'Lifestyle Marketplace' }, 0, 20, field, order)
                .then(function (lifestyle) {
                    return callback(null, lifestyle.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        }

    }, function (err, results) {
        if (!err) {
            res.render('lifestyle', results);
        }
        else {
            res.render('lifestyle', err);
        }
    });

}









