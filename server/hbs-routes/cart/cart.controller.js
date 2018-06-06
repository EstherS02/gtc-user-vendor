'use strict';

const async = require('async');
const _ = require('lodash');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');
const populate = require('../../utilities/populate');



export function cart(req, res) {
    var LoggedInUser = {};

    if (req.user)
        LoggedInUser = req.user;

    let user_id = LoggedInUser.id;

    async.series({
        cartItems: function(cb) {

            var queryObj = {};
            let includeArr = [];

            queryObj['user_id'] = user_id;

            queryObj['status'] = {
                '$eq': status["ACTIVE"]
            }


            return model["Cart"].findAndCountAll({
                where: queryObj,
                include: [{
                        model: model["User"]
                    },
                    {
                        model: model["Product"],
                        include: [{
                                model: model["Vendor"]
                            },
                            {
                                model: model["Category"]
                            },
                            {
                                model: model["SubCategory"]
                            },
                            {
                                model: model["Marketplace"]
                            },
                            {
                                model: model["MarketplaceType"]
                            },
                            {
                                model: model["Country"]
                            },
                            {
                                model: model["State"]
                            },
                            {
                                model: model["ProductMedia"],
                                where: {
                                    base_image: 1,
                                    status : {
                                        '$eq': status["ACTIVE"]
                                    }
                                }
                            }
                        ]
                    }
                ]
            }).then(function(data) {
                var result = JSON.parse(JSON.stringify(data));
                return cb(null, result)
            }).catch(function(error) {
                console.log('Error:::', error);
                return cb(error);
            });
        },
        marketPlace: function(cb) {

            var searchObj = {};
            let includeArr = [];

            searchObj['status'] = {
                '$eq': status["ACTIVE"]
            }

            return service.findRows('Marketplace', searchObj, null, null, 'created_on', "asc", includeArr)
                .then(function(marketPlaceData) {
                    marketPlaceData = JSON.parse(JSON.stringify(marketPlaceData));
                    return cb(null, marketPlaceData)
                }).catch(function(error) {
                    console.log('Error :::', error);
                    return cb(error);
                });
        }
    }, function(err, results) {
        if (!err) {

            var totalItems = results.cartItems.rows;
            var allMarketPlaces = results.marketPlace.rows;
            var totalPrice = {};
            var defaultShipping = 50;

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

            console.log(totalPrice)

            return res.status(200).render('cart', {
                title: "Global Trade Connect",
                cartItems: results.cartItems.rows,
                cartItemsCount: results.cartItems.count,
                marketPlaces: results.marketPlace.rows,
                seperatedItemsList: seperatedItems,
                totalPriceList: totalPrice,
                LoggedInUser: LoggedInUser
            });
              /* return res.status(200).send({
                 title : "Global Trade Connect",
                 seperatedItemsList : seperatedItems,
                 cartItems: results.cartItems.rows,
                 cartItemsCount: results.cartItems.count,
                 marketPlaces: results.marketPlace.rows,
                 seperatedItemsList : seperatedItems
             });  */
        } else {
            console.log(err)
            return res.status(500).render(err);
        }
    });

}


function plainTextResponse(response) {
    return response.get({
        plain: true
    });
}