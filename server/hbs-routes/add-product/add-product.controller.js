'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');
const async = require('async');

export function AddProduct(req, res) {

    var categoryModel = "Category";
    var countryModel = "Country";
    var marketplaceModel = "Marketplace";

    var offset, limit, field, order;
    var queryObj = {},  LoggedInUser = {};

    offset = 0;
    limit = null;
    field = "id";
    order = "asc";

    var LoggedInUser = {};

    if(req.user)
    LoggedInUser = req.user;
    
    //queryParams['user_id'] = LoggedInUser.id;


    queryObj['status'] = status["ACTIVE"];

    async.series({
        category: function (callback) {
            service.findRows(categoryModel, queryObj, offset, limit, field, order)
                .then(function (category) {
                    return callback(null, category.rows);

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
        marketplace: function (callback) {
            service.findRows(marketplaceModel, queryObj, offset, limit, field, order)
                .then(function (marketplace) {
                    return callback(null, marketplace.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
    }, function (err, results) {
        if (!err) {
            res.render('add-product', {
                title: "Global Trade Connect",
                category: results.category,
                country: results.country,
                marketplace:results.marketplace,
                LoggedInUser: LoggedInUser
            });
        }
        else {
            res.render('add-product', err);
        }
    });
}