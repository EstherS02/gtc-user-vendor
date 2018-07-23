'use strict';

const async = require('async');
const _ = require('lodash');
const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const reference = require('../../../config/model-reference');
const orderStatus = require('../../../config/order_status');
const status = require('../../../config/status');
const service = require('../../../api/service');
const cartObj = require('../../../api/cart/cart.controller');
const populate = require('../../../utilities/populate');

export function orderView(req, res) {
    var LoggedInUser = {}, searchObj = {}, itemIncludeArr = [], orderIncludeArr=[];
    var order_id;
    var marketPlaceModel = 'Marketplace';
    var orderItemsModel = 'OrderItem';
    var orderModel = 'Order';

    if (req.user)
        LoggedInUser = req.user;

    itemIncludeArr = populate.populateData('Product,Product.Marketplace,Order');
    orderIncludeArr = populate.populateData('Shipping');

    async.series({

        order: function(cb){
            if (req.params.id)
                var id = req.params.id;

               return service.findIdRow(orderModel, id,[])
                .then(function(order){
                    return cb(null, order)
                }).catch(function(error){
                    console.log('Error :::', error);
                    return cb(error);
                })
        },
        orderItems: function(cb) {

            var queryObj = {};
            let includeArr = [];

            if (req.params.id)
               queryObj["order_id"] = req.params.id;

            queryObj['status'] = {
                '$eq': status["ACTIVE"]
            }

            return model["OrderItem"].findAndCountAll({
                where: queryObj,
                include: [{
                    model: model["Order"],
                    }, {
                    model: model["Product"],
                    include: [{
                        model: model["Vendor"]
                    }, {
                        model: model["Category"]
                    }, {
                        model: model["SubCategory"]
                    }, {
                        model: model["Marketplace"]
                    }, {
                        model: model["MarketplaceType"]
                    }, {
                        model: model["Country"]
                    }, {
                        model: model["State"]
                    }, {
                        model: model["ProductMedia"],
                        where: {
                            base_image: 1,
                            status: {
                                '$eq': status["ACTIVE"]
                            }
                        }
                    }]
                }]
            }).then(function(data) {
                var result = JSON.parse(JSON.stringify(data));
                return cb(null, result)
            }).catch(function(error) {
                console.log('Error:::', error);
                return cb(error);
            });
        },
        marketPlace: function (cb) {

            var searchObj = {};
            let includeArr = [];

            searchObj['status'] = {
                '$eq': status["ACTIVE"]
            }
            return service.findRows(marketPlaceModel, searchObj, null, null, 'created_on', "asc", includeArr)
                .then(function (marketPlaceData) {
                    marketPlaceData = JSON.parse(JSON.stringify(marketPlaceData));
                    return cb(null, marketPlaceData)
                }).catch(function (error) {
                    console.log('Error :::', error);
                    return cb(error);
                });
        },
    }, function (err, results) {
        if (!err) {
            var totalItems = results.orderItems.rows;
            var allMarketPlaces = results.marketPlace.rows;
            var totalPrice = {};
            var defaultShipping = 0;

            totalPrice['grandTotal'] = 0;

            var seperatedItems = _.groupBy(totalItems, "Product.Marketplace.code");

            _.forOwn(seperatedItems, function(itemsValue, itemsKey) {
                totalPrice[itemsKey] = {};
                totalPrice[itemsKey]['price'] = 0;
                totalPrice[itemsKey]['shipping'] = 0;
                totalPrice[itemsKey]['total'] = 0;

                for (var i = 0; i < itemsValue.length; i++) {

                    if ((itemsKey == itemsValue[i].Product.Marketplace.code) && itemsValue[i].Product.price) {

                        var calulatedSum = (itemsValue[i].quantity * itemsValue[i].Product.price);

                        totalPrice[itemsKey]['price'] = totalPrice[itemsKey]['price'] + calulatedSum;
                        totalPrice[itemsKey]['shipping'] = totalPrice[itemsKey]['shipping'] + defaultShipping;
                        totalPrice[itemsKey]['total'] = totalPrice[itemsKey]['price'] + totalPrice[itemsKey]['shipping'];
                    }
                }

                totalPrice['grandTotal'] = totalPrice['grandTotal'] + totalPrice[itemsKey]['total'];
            });

            var result_obj = {
                title: "Global Trade Connect",
                LoggedInUser: LoggedInUser,
                marketPlaces: results.marketPlace.rows,
                order: results.order,
                orderItems: results.orderItems.rows,
                orderItemsCount: results.orderItems.count,
                seperatedItemsList: seperatedItems,
                totalPriceList: totalPrice,
                orderStatus: orderStatus
            }
            return res.status(200).render('orderView', result_obj);
        }
        else {
            res.render('orderView', err);
        }
    });
}