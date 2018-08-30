'use strict';

const request = require('request');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');
var async = require('async');
const vendorPlan = require('../../config/gtc-plan');

export function paymentSettings(req, res) {

    if(!req.query.code){
        paymentSettingFunction(req,res);
    }else{

        var bodyParams = {}, queryObj = {};
            var vendorModel = 'Vendor';
    
            var data = {
                client_secret: 'sk_test_5zda4q0XHsYdJLjbulqoCVpl',
                code: req.query.code,
                grant_type: "authorization_code"
            }
    
            request.post({
                "headers": { "content-type": "application/json" },
                "url": 'https://connect.stripe.com/oauth/token',
                body: JSON.stringify(data)
            }, (error, response, body) => {
                if (error) {
                    console.log("Error::", error);
                } else {
                    queryObj = {
                        user_id: req.user.id
                    }

                    var stripeBody = JSON.parse(body);

                    var stripeId = stripeBody.stripe_user_id;

                    	bodyParams = {
                            vendor_payout_stripe_id: stripeId
                        }
                        service.updateRecord(vendorModel, bodyParams, queryObj)
                            .then(function (row) {
                                if (row) {
                                    console.log("row:",row)
                                } else {
                                }
                            }).catch(function (error) {
                                if (error) {
                                    console.log("error:",error);
                                }
                            })
                }
            });  
            paymentSettingFunction(req,res);
    }   
}

function paymentSettingFunction(req,res){

    var LoggedInUser = {}, bottomCategory = {}, vendorQueryObj = {};
    var vendorIncludeArr = [];
    var offset, limit, field, order;

    offset = 0;
    field = "id";
    order = "asc";
    limit = 6;

    var currencyModel = 'Currency';
    var vendorModel = 'Vendor';

    if (req.user)
        LoggedInUser = req.user;

    let user_id = LoggedInUser.id;

    vendorQueryObj['user_id'] = user_id;

    vendorIncludeArr = [
        {
            "model": model['Currency'],
            atrribute: ['id', 'name']
        }
    ]
   
    async.series({
        cartCounts: function (callback) {
            service.cartHeader(LoggedInUser).then(function (response) {
                return callback(null, response);
            }).catch(function (error) {
                console.log('Error :::', error);
                return callback(null);
            });
        },
        categories: function (callback) {
            var includeArr = [];
            const categoryOffset = 0;
            const categoryLimit = null;
            const categoryField = "id";
            const categoryOrder = "asc";
            var categoryModel = "Category";
            const categoryQueryObj = {};

            categoryQueryObj['status'] = statusCode["ACTIVE"];

            service.findAllRows(categoryModel, includeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
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
        currency: function (callback) {
            service.findRows(currencyModel, {}, offset, limit, field, order)
                .then(function (currency) {
                    return callback(null, currency.rows);

                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        },
        vendorPaymentInfo: function (callback) {
            service.findOneRow(vendorModel, vendorQueryObj, vendorIncludeArr)
                .then(function (vendor) {
                    return callback(null, vendor);
                }).catch(function (error) {
                    console.log('Error :::', error);
                    return callback(null);
                });
        }

    },
    function (err, results) {
            console.log(results)
            if (!err) {
                res.render('vendorNav/payment-settings', {
                    title: "Global Trade Connect",
                    LoggedInUser: LoggedInUser,
                    categories: results.categories,
                    bottomCategory: bottomCategory,
                    selectedPage: 'payment-settings',
                    cartheader: results.cartCounts,
                    vendorPlan: vendorPlan,
                    currency: results.currency,
                    vendorPaymentInfo: results.vendorPaymentInfo
                });
            } else {
                res.render('vendorNav/payment-settings', err);
            }
        });
}