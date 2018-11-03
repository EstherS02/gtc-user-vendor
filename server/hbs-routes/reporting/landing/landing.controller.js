'use strict';

const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const statusCode = require('../../../config/status');
const service = require('../../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');
const _ = require('lodash');
const marketplace = require('../../../config/marketplace');
const cartService = require('../../../api/cart/cart.service');
const orderStatus = require('../../../config/order_status');
var async = require('async');
const vendorPlan = require('../../../config/gtc-plan');
const ReportService = require('../../../utilities/reports');

export function reporting(req, res) {
    console.log('reporting req query', req.query);
    var LoggedInUser = {};
    var queryURI = {};
    var bottomCategory = {};
    var categoryModel = "Category";
    var lhsBetween = [];
    var rhsBetween = [];
    queryURI['compare'] = 'true';

    if (req.user)
        LoggedInUser = req.user;

    let user_id = LoggedInUser.id;

    if (req.query.lhs_from && req.query.lhs_to) {
        lhsBetween.push(moment(req.query.lhs_from).format("YYYY/MM/DD"), moment(req.query.lhs_to).format("YYYY/MM/DD"))
    } else {
        lhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
    }
    if (req.query.rhs_from && req.query.rhs_to) {
        rhsBetween.push(moment(req.query.rhs_from).format("YYYY/MM/DD"), moment(req.query.rhs_to).format("YYYY/MM/DD"));
    } else {
        rhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().format("YYYY/MM/DD"));
    }

    let orderItemQueryObj = {};
    if (req.user.role == 2)
        orderItemQueryObj.vendor_id = req.user.Vendor.id;

    queryURI['rep_from'] = moment(lhsBetween[0]).format("MM/DD/YYYY");
    queryURI['rep_to'] = moment(lhsBetween[1]).format("MM/DD/YYYY");;
    queryURI['com_from'] = moment(rhsBetween[0]).format("MM/DD/YYYY");;
    queryURI['com_to'] = moment(rhsBetween[1]).format("MM/DD/YYYY");;

    async.series({
            cartInfo: function(callback) {
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
            topProducts: function(callback) {
                ReportService.topPerformingProducts(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
                    console.log('topProducts', results);
                    return callback(null, results);
                }).catch((err) => {
                    console.log('topProducts err', err);
                    return callback(err);
                });
            },
            topMarketPlace: function(callback) {
                ReportService.topPerformingMarketPlaces(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
                    return callback(null, results);
                }).catch((err) => {
                    console.log('topMarketPlace err', err);
                    return callback(err);
                });
            },
            revenueChanges: function(callback) {
                ReportService.revenueChanges(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
                    return callback(null, results);
                }).catch((err) => {
                    console.log('revenueChanges err', err);
                    return callback(err);
                });
            },
            revenueCounts: function(callback) {
                ReportService.revenueChangesCounts(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
                    return callback(null, results);
                }).catch((err) => {
                    console.log('revenueCounts err', err);
                    return callback(err);
                });
            }
        },
        function(err, results) {
            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
            var dropDownUrl = fullUrl.replace(req.protocol + '://' + req.get('host'), '').replace('/', '');
            if (!err) {
                res.render('vendorNav/reporting/reporting', {
                    title: "Global Trade Connect",
                    products: results.products,
                    marketPlace: marketplace,
                    LoggedInUser: LoggedInUser,
                    categories: results.categories,
                    bottomCategory: bottomCategory,
                    selectedPage: 'reporting',
                    vendorPlan: vendorPlan,
                    dropDownUrl: dropDownUrl,
                    queryURI: queryURI,
                    cart: results.cartInfo,
                    topProducts: results.topProducts,
                    topMarketPlace: results.topMarketPlace,
                    revenueChanges: results.revenueChanges,
                    revenueCounts: results.revenueCounts,
                    statusCode: statusCode
                });
            } else {
                res.render('vendorNav/reporting/reporting', err);
            }
        });
}