'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');
const _ = require('lodash');
import series from 'async/series';
var async = require('async');

export function compare(req, res) {
    var LoggedInUser = {};
    var bottomCategory = {};

    if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable) {
        LoggedInUser = req.gtcGlobalUserObj;
    }
    var ids = [];

    if (req.session && req.session['compare']) {
        console.log("req.session['compare']==================================", req.session['compare'])
        ids = req.session['compare'];
    }
    ids = [1, 18];
    let user_id = LoggedInUser.id;
    var includeArr = [{
        model: model["ProductMedia"],
        where: {
            status: {
                '$eq': status["ACTIVE"]
            }
        }
    }, {
        model: model["Category"],
        include: [{
            model: model["CategoryAttribute"],
            include: [{
                model: model["Attribute"],
            }]
        }]
    }, {
        model: model['ProductAttribute'],
        include: [{
            model: model["Attribute"],
        }]
    }, {
        model: model['Vendor']
    }, {
        model: model['Review']
    }];
    var queryObj = {
        id: ids
    };
    var field = 'id';
    var order = 'asc';
    async.series({
            compare: function(callback) {
                service.findAllRows('Product', includeArr, queryObj, 0, null, field, order)
                    .then(function(response) {
                        return callback(null, response);
                    }).catch(function(error) {
                        console.log('Error :::', error);
                        return callback(null);
                    });
            },
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

                categoryQueryObj['status'] = status["ACTIVE"];

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
            }
        },
        function(err, results) {
            if (!err) {
                var compare = results.compare;
                var average = [];
                if (results.compare.rows) {
                    _.forOwn(compare.rows, function(element) {
                        var avg = _.meanBy(element.Reviews, (p) => p.rating);
                        element.avg_rating = (avg > 0) ? avg : 0;
                        element.review_count = element.Reviews.length;
                    });
                }
                // result = Object.assign(...a.map((v, i) => b.includes(v) && {
                //     [i]: v
                // }));
                res.render('compare', {
                    title: "Global Trade Connect",
                    categories: results.categories,
                    bottomCategory: bottomCategory,
                    cartheader: results.cartCounts,
                    compare: results.compare,
                    LoggedInUser: LoggedInUser,
                });
            } else {
                res.render('compare', err);
            }
        });

}