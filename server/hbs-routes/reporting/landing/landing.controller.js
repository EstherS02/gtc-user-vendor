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

export function reporting(req, res) {
    var LoggedInUser = {};

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
                res.render('vendorNav/reporting/reporting', {
                    title: "Global Trade Connect",
                    products: results.products,
                    marketPlace: marketPlace,
                    LoggedInUser: LoggedInUser,
                    category: results.category,
                    selectedPage: 'reporting',
                    vendorPlan: vendorPlan,
                    dropDownUrl: dropDownUrl,
                });
            } else {
                res.render('vendorNav/reporting/reporting', err);
            }
        });
}