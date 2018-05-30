'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');
const async = require('async');

export function AddProduct(req, res) {

    var categoryModel = "Category";
    var subcategoryModel = "SubCategory";

    var offset, limit, field, order;
    var queryObj = {};

    offset = 0;
    limit = null;
    field = "id";
    order = "asc";

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
    }, function (err, results) {
        if (!err) {
            res.render('add-product', {
                title: "Global Trade Connect",
                category: results.category
            });
        }
        else {
            res.render('add-product', err);
        }
    });
}