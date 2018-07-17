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

// salesHistory
export function salesHistory(req, res) {
    console.log("current url", req.url)
    var LoggedInUser = {};
    // console.log(req.user.Vendor.id)
    if (req.user)
        LoggedInUser = req.user;

    var queryURI = {};
    var queryPaginationObj = {};
    var orderItemQueryObj = {};
    var orderQueryObj = {};
    var productQueryObj = {};
    var queryUrl = {};
    //  Query string assignment
    var from_date = req.query.from_date;
    var to_date = req.query.to_date;
    var dateSelect = req.query.dateSelect;
    var marketType = req.query.marketType;
    var status = req.query.status;
    var start_date;
    var end_date;
    if (dateSelect) {
        queryURI['dateSelect'] = dateSelect;
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
    queryURI['start_date'] = start_date;
    queryURI['end_date'] = end_date;


    if (marketType) {
        queryURI['marketType'] = marketType;
        productQueryObj['marketplace_id'] = marketType;
    }
    if (status) {
        queryURI['status'] = status;
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
    queryPaginationObj['offset'] = offset;
    delete req.query.offset;
    limit = req.query.limit ? parseInt(req.query.limit) : 10;
    queryPaginationObj['limit'] = limit;
    delete req.query.limit;
    order = req.query.order ? req.query.order : "desc";
    queryPaginationObj['order'] = order;
    delete req.query.order;
    page = req.query.page ? parseInt(req.query.page) : 1;
    queryPaginationObj['page'] = page;
    delete req.query.page;
    if (req.query.keyword) {
        queryPaginationObj.keyword = req.query.keyword;
        queryURI['keyword'] = req.query.keyword;
        productQueryObj['product_name'] = {
            like: '%' + req.query.keyword + '%'
        };
    }
    var field = "id";
    offset = (page - 1) * limit;
    queryPaginationObj['offset'] = offset;
    var maxSize;
    // End pagination
    var modelName = "OrderItem";
    productQueryObj['vendor_id'] = req.user.Vendor.id;
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
            },
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
            maxSize = results.orderHistory.count / limit;
            if (results.orderHistory.count % limit)
                maxSize++;

            var total_transaction = 0.00;
            if (results.orderHistory.count > 0) {
                results.orderHistory.rows.forEach((value, index) => {
                    total_transaction += parseFloat(value.final_price);
                    results.orderHistory.rows[index]['final_price'] = (parseFloat(value.final_price)).toFixed(2);
                });
            }

            queryPaginationObj['maxSize'] = maxSize;
            if (!err) {
                console.log("start_date", queryURI['start_date']);
                res.render('vendorNav/reporting/sales-history', {
                    title: "Global Trade Connect",
                    OrderItems: results.orderHistory.rows,
                    count: results.orderHistory.count,
                    queryURI: queryURI,
                    LoggedInUser: LoggedInUser,
                    statusCode: statusCode,
                    marketPlace: marketPlace,
                    category: results.category,
                    queryUrl: queryUrl,
                    selectedPage: 'sales-history',
                    totalTransaction: (total_transaction).toFixed(2),
                    orderStatus: orderStatus,
                    // pagination
                    page: page,
                    maxSize: maxSize,
                    pageSize: limit,
                    queryPaginationObj: queryPaginationObj,
                    collectionSize: results.orderHistory.count,
                    // End pagination
                    vendorPlan: vendorPlan,
                    dropDownUrl: dropDownUrl
                });
            } else {
                res.render('vendorNav/reporting/sales-history', err);
            }
        });
}
// Ends salesHistory