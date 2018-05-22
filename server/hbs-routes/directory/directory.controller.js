'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');
const async = require('async');
import series from 'async/series';


export function directory(req, res) {
    var field = "id";
    var order = "asc";

    async.series({
        category: function (callback) {

            service.findRows('Category', { status: 1 }, 0, 10, field, order)
                .then(function (category) {
                    return callback(null, category.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        subCategory: function (callback) {

            service.findRows('SubCategory', { status: 1 }, null, null, field, order)
                .then(function (subCategory) {
                    console.log("subCategory.rows",subCategory.rows)
                    return callback(null, subCategory.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        }
    }, function (err, results) {
        if (!err) {
             res.render('directory', results);
        }
        else {
            res.render('directory', err);
        }
    });
}
