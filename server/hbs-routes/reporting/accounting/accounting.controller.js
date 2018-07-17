'use strict';

const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const reference = require('../../../config/model-reference');
const statusCode = require('../../../config/status');
const service = require('../../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');
const marketPlace = require('../../../config/marketplace');
const orderStatus = require('../../../config/order_status');
var async = require('async');
const vendorPlan = require('../../../config/gtc-plan');

export function accounting(req, res) {
    var LoggedInUser = {},queryURI = {};

    if (req.user)
        LoggedInUser = req.user;

    let user_id = LoggedInUser.id;
    async.series({
            category: function(callback) {
                service.findRows("Category", {}, 0, null, 'id', 'asc')
                    .then(function(category) {
                        return callback(null, category.rows);

                    }).catch(function(error) {
                        console.log('Error :::', error);
                        return callback(null);
                    });
            }
        },
        function(err, results) {

            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
            var dropDownUrl = fullUrl.replace(req.url, '').replace(req.protocol + '://' + req.get('host'), '').replace('/', '');
            if (!err) {
                console.log("start_date", queryURI['start_date']);
                res.render('vendorNav/reporting/accounting', {
                    title: "Global Trade Connect",
                    category: results.category,
                    //queryUrl: queryUrl,
                    selectedPage: 'accounting',
                    orderStatus: orderStatus,
                    vendorPlan: vendorPlan,
                    LoggedInUser: LoggedInUser,
                    dropDownUrl: dropDownUrl,
                    // pagination
                    // page: page,
                    // maxSize: maxSize,
                    // pageSize: limit,
                    // queryPaginationObj:queryPaginationObj,
                    // collectionSize: results.orderHistory.count
                    // End pagination
                });
            } else {
                res.render('vendorNav/reporting/accounting', err);
            }
        });

}
