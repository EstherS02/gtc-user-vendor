'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const status = require('../../config/status');
const service = require('../../api/service');
const async = require('async');
const marketplace = require('../../config/marketplace');
const cartService = require('../../api/cart/cart.service');
const vendorPlan = require('../../config/gtc-plan');
const notifictionService = require('../../api/notification/notification.service');

export function webRTC(req, res) {

    var LoggedInUser = {};
    var bottomCategory = {};

    if (req.user)
        LoggedInUser = req.user;

        console.log("req.user.id", req.user.id)

    async.series({
        cartInfo: function (callback) {
            if (LoggedInUser.id) {
                cartService.cartCalculation(LoggedInUser.id, req, res)
                    .then((cartResult) => {
                        return callback(null, cartResult);
                    }).catch((error) => {
                        return callback(error);
                    });
            } else {
                return callback(null);
            }
        },
        categories: function (callback) {
            var includeArr = [];
            var categoryOffset, categoryLimit, categoryField, categoryOrder;
            var categoryQueryObj = {};

            categoryOffset = 0;
            categoryLimit = null;
            categoryField = "id";
            categoryOrder = "asc";

            categoryQueryObj['status'] = status["ACTIVE"];

            service.findAllRows('Category', includeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
                .then(function (category) {
                    var categories = category.rows;
                    bottomCategory['left'] = categories.slice(0, 8);
                    bottomCategory['right'] = categories.slice(8, 16);
                    return callback(null, category.rows);
                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        unreadCounts: function(callback) {
            if (LoggedInUser.id) {
                notifictionService.notificationCounts(LoggedInUser.id)
                    .then(function(counts) {
                        return callback(null, counts);
                    }).catch(function(error) {
                        return callback(null);
                    });
            } else {
                return callback(null);
            }
        }
    }, function (err, results) {
        if(results){
            res.render('web-rtc', {
				title: "Global Trade Connect",
				cart: results.cartInfo,
				categories: results.categories,
                unreadCounts: results.unreadCounts,
                stunServer: config.videoCall,
                LoggedInUser: LoggedInUser,
                bottomCategory: bottomCategory
			});
        }

    });
}