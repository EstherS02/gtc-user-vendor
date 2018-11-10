'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');
const marketPlace = require('../../config/marketplace');
const orderStatus = require('../../config/order_status');
var async = require('async');
const vendorPlan = require('../../config/gtc-plan');
const notifictionService = require('../../api/notification/notification.service');

export function reporting(req, res) {
    var LoggedInUser = {};
    var bottomCategory = {};
    var categoryModel = "Category";

    if (req.user)
        LoggedInUser = req.user;

    var queryObjCategory = {
        status: statusCode['ACTIVE']
    };

    let user_id = LoggedInUser.id;
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
            unreadCounts: function(callback) {
                notifictionService.notificationCounts(user_id)
                    .then(function(counts) {
                        return callback(null, counts);
                    }).catch(function(error) {
                        return callback(null);
                    });
            }
        },
        function(err, results) {
            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
            var dropDownUrl = fullUrl.replace(req.url, '').replace(req.protocol + '://' + req.get('host'), '').replace('/', '');
            if (!err) {
                res.render('reporting', {
                    title: "Global Trade Connect",
                    products: results.products,
                    marketPlace: marketPlace,
                    LoggedInUser: LoggedInUser,
                    categories: results.categories,
                    unreadCounts: results.unreadCounts,
                    bottomCategory: bottomCategory,
                    selectedPage: 'reporting',
                    vendorPlan: vendorPlan,
                    dropDownUrl: dropDownUrl,
                });
            } else {
                res.render('reporting', err);
            }
        });
}