'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');
const marketPlace = require('../../config/marketplace');
import series from 'async/series';
var async = require('async');

export function reporting(req, res) {
    var LoggedInUser = {};

    if (req.user)
        LoggedInUser = req.user;

    let user_id = LoggedInUser.id;

    res.render('reporting', {
        title: "Global Trade Connect",
        LoggedInUser: LoggedInUser
    });
}

export function performance(req, res) {
    var LoggedInUser = {};

    if (req.user)
        LoggedInUser = req.user;

    let user_id = LoggedInUser.id;

    res.render('performance', {
        title: "Global Trade Connect",
        LoggedInUser: LoggedInUser
    });
}


export function accounting(req, res) {
    var LoggedInUser = {};

    if (req.user)
        LoggedInUser = req.user;

    let user_id = LoggedInUser.id;

    res.render('accounting', {
        title: "Global Trade Connect",
        LoggedInUser: LoggedInUser
    });
}

export function tax(req, res) {
    var LoggedInUser = {};

    if (req.user)
        LoggedInUser = req.user;

    let user_id = LoggedInUser.id;

    res.render('tax', {
        title: "Global Trade Connect",
        LoggedInUser: LoggedInUser
    });
}

// salesHistory
export function salesHistory(req, res) {
    console.log("current url", req.url)
    var LoggedInUser = {};
    // console.log(req.user.Vendor.id)
    if (req.user)
        LoggedInUser = req.user;

    var queryObject = {};
    var orderItemQueryObj = {};
    var orderQueryObj = {};
    var productQueryObj = {};
    var queryUrl = {};
    queryUrl['url'] = req.url;
    //  Query string assignment
    var from_date = req.query.from_date;
    var to_date = req.query.to_date;
    var dateSelect = req.query.dateSelect;
    var marketType = req.query.marketType;
    var status = req.query.status;
    var start_date;
    var end_date;
    if (dateSelect) {
        queryObject['dateSelect'] = dateSelect;
        end_date = moment().add(0, 'd').toDate();
        if (dateSelect == "today") {
            start_date = moment();
        } else if (dateSelect == "yesterday") {
            start_date = moment().add(-1, 'd').toDate();
        } else if (dateSelect == "last7day") {
            start_date = moment().add(-7, 'd').toDate();
        } else if (dateSelect == "last15day") {
            start_date = moment().add(-15, 'd').toDate();
        } else if (dateSelect == "last30day") {
            start_date = moment().add(-30, 'd').toDate();
        } else {
            if (from_date) {
                start_date = from_date;
            } else {
                start_date = moment().add(-70, 'd').toDate();
            }
            if (to_date) {
                end_date = to_date;
            } else {
                end_date = moment().add(0, 'd').toDate();
                // end_date= moment().toDate();
            }
        }

    } else {
        if (from_date) {
            start_date = from_date;
        } else {
            start_date = moment().add(-70, 'd').toDate();
        }
        if (to_date) {
            end_date = to_date;
        } else {
            end_date = moment().add(0, 'd').toDate();
        }
        orderQueryObj['ordered_date'] = {
            $between: [start_date, end_date]
        };
    }

    orderQueryObj['ordered_date'] = {
        $between: [start_date, end_date]
    };
    queryObject['start_date'] = start_date;
    queryObject['end_date'] = end_date;


    if (marketType) {
        queryObject['marketType'] = marketType;
        productQueryObj['marketplace_id'] = marketType;
    }
    if (status) {
        queryObject['status'] = status;
        orderQueryObj['status'] = statusCode[status];
    }
    // end Query string assignment
    var order = "desc"; //"asc"
    var offset = 0;
    var limit = 1;
    // var vendor_id = req.user.Vendor.id;
    let user_id = LoggedInUser.id;
    //pagination 
    var page;
    offset = req.query.offset ? parseInt(req.query.offset) : 0;
    delete req.query.offset;
    limit = req.query.limit ? parseInt(req.query.limit) : 10;
    delete req.query.limit;
    order = req.query.order ? req.query.order : "desc";
    delete req.query.order;
    page = req.query.page ? parseInt(req.query.page) : 1;
    delete req.query.page;
    var field = "id";
    offset = (page - 1) * limit;
    var maxSize;
    // End pagination
    var modelName = "OrderItem";
    productQueryObj['vendor_id'] = 28; //req.user.Vendor.id;
    console.log("productQueryObj", productQueryObj)
    var includeArr = [{
        model: model["Order"],
        where: orderQueryObj,
        attributes: ['id', 'invoice_id', 'delivered_on', 'ordered_date', 'user_id', 'total_price']
    }, {
        model: model['Product'],
        where: productQueryObj,
        include: [{
            model: model['Vendor'],
        }]
    }];
    async.series({
            orderHistory: function(callback) {
                service.findRows(modelName, orderItemQueryObj, offset, limit, field, order, includeArr)
                    .then(function(results) {
                        return callback(null, results);
                    }).catch(function(error) {
                        console.log('Error :::', error);
                        return callback(null);
                    });
            }
        },
        function(err, results) {
            maxSize = results.orderHistory.count / limit;
            if (results.orderHistory.count % limit)
                maxSize++;
            if (!err) {
                console.log("start_date", queryObject['start_date']);
                res.render('sales-history', {
                    title: "Global Trade Connect",
                    OrderItems: results.orderHistory.rows,
                    count: results.orderHistory.count,
                    queryObject: queryObject,
                    LoggedInUser: LoggedInUser,
                    marketPlace: marketPlace,
                    queryUrl: queryUrl,
                    // pagination
                    page: page,
                    maxSize: maxSize,
                    pageSize: limit,
                    // queryPaginationObj:queryPaginationObj,
                    collectionSize: results.orderHistory.count
                    // End pagination
                });
            } else {
                res.render('sales-history', err);
            }
        });
}
// Ends salesHistory