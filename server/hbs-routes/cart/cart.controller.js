'use strict';

const async = require('async');
const _ = require('lodash');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');
const cartObj = require('../../api/cart/cart.controller');
const populate = require('../../utilities/populate');



export function cart(req, res) {
    var LoggedInUser = {};
    var bottomCategory = {};
    var categoryModel = "Category";

    if (req.user)
        LoggedInUser = req.user;

    let user_id = LoggedInUser.id;
    var bottomCategory = {};


    async.series({
        cartCounts: function (callback) {
            service.cartHeader(LoggedInUser).then(function (response) {
                return callback(null, response);
            }).catch(function (error) {
                console.log('Error :::', error);
                return callback(null);
            });
        },
        cartItems: function (cb) {

            var queryObj = {};
            let includeArr = [];

            queryObj['user_id'] = user_id;

            queryObj['status'] = {
                '$eq': status["ACTIVE"]
            }

            return model["Cart"].findAndCountAll({
                where: queryObj,
                include: [{
                    model: model["User"],
                    attributes: {
                        exclude: ['hashed_pwd', 'salt', 'email_verified_token', 'email_verified_token_generated', 'forgot_password_token', 'forgot_password_token_generated']
                    }
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
            }).then(function (data) {
                var result = JSON.parse(JSON.stringify(data));
                return cb(null, result)
            }).catch(function (error) {
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

            return service.findRows('Marketplace', searchObj, null, null, 'created_on', "asc", includeArr)
                .then(function (marketPlaceData) {
                    marketPlaceData = JSON.parse(JSON.stringify(marketPlaceData));
                    return cb(null, marketPlaceData)
                }).catch(function (error) {
                    console.log('Error :::', error);
                    return cb(error);
                });
        },
        categories: function (cb) {
            var includeArr = [];
            const categoryOffset = 0;
            const categoryLimit = null;
            const categoryField = "id";
            const categoryOrder = "asc";
            var categoryModel = "Category";
            const categoryQueryObj = {};

            categoryQueryObj['status'] = status["ACTIVE"];

            service.findAllRows(categoryModel, includeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
                .then(function (category) {
                    var categories = category.rows;
                    bottomCategory['left'] = categories.slice(0, 8);
                    bottomCategory['right'] = categories.slice(8, 16);
                    return cb(null, category.rows);
                }).catch(function (error) {
                    console.log('Error :::', error);
                    return cb(null);
                });
        }
    }, function (err, results) {
        if (!err) {
            var totalItems = results.cartItems.rows;
            var allMarketPlaces = results.marketPlace.rows;
            var totalPrice = {};
            var defaultShipping = 0;

            totalPrice['grandTotal'] = 0;

            var seperatedItems = _.groupBy(totalItems, "Product.Marketplace.code");


            _.forOwn(seperatedItems, function (itemsValue, itemsKey) {
                totalPrice[itemsKey] = {};
                totalPrice[itemsKey]['price'] = 0;
                totalPrice[itemsKey]['shipping'] = 0;
                totalPrice[itemsKey]['total'] = 0;

                for (var i = 0; i < itemsValue.length; i++) {

                    if ((itemsKey == itemsValue[i].Product.Marketplace.code) && itemsValue[i].Product.price) {
                        if (itemsValue[i].Product.moq) {
                            var calulatedSum = (itemsValue[i].Product.moq * itemsValue[i].Product.price);

                            totalPrice[itemsKey]['price'] = totalPrice[itemsKey]['price'] + calulatedSum;
                            totalPrice[itemsKey]['shipping'] = totalPrice[itemsKey]['shipping'] + defaultShipping;
                            totalPrice[itemsKey]['total'] = totalPrice[itemsKey]['price'] + totalPrice[itemsKey]['shipping'];
                        }
                        else {
                            var calulatedSum = (itemsValue[i].quantity * itemsValue[i].Product.price);

                            totalPrice[itemsKey]['price'] = totalPrice[itemsKey]['price'] + calulatedSum;
                            totalPrice[itemsKey]['shipping'] = totalPrice[itemsKey]['shipping'] + defaultShipping;
                            totalPrice[itemsKey]['total'] = totalPrice[itemsKey]['price'] + totalPrice[itemsKey]['shipping'];
                        }

                    }
                }

                totalPrice['grandTotal'] = totalPrice['grandTotal'] + totalPrice[itemsKey]['total'];
            });

            var coupon_data = [];
            if (typeof (req.cookies.check_promo_code) != 'undefined') {
                let default_promo_obj = req.cookies.check_promo_code;
                var obj_key = -1;
                for (let key in default_promo_obj) {
                    if (default_promo_obj[key].user_id == user_id) {
                        obj_key = key;
                    }
                }

                if (obj_key > -1) {
                    coupon_data.push(req.cookies.check_promo_code[obj_key]);
                }
            }
            var result_obj = {
                title: "Global Trade Connect",
                cartItems: results.cartItems.rows,
                cartItemsCount: results.cartItems.count,
                marketPlaces: results.marketPlace.rows,
                seperatedItemsList: seperatedItems,
                totalPriceList: totalPrice,
                LoggedInUser: LoggedInUser,
                categories: results.categories,
                bottomCategory: bottomCategory,
                cartheader: results.cartCounts,
                couponData: [],
                couponUpdateError: "",
                couponUpdateErrorMessage: ""
            }
            console.log(coupon_data)
            if (coupon_data.length > 0) {
                var original_price = coupon_data[0].original_price;
                if (parseFloat(totalPrice['grandTotal']) != parseFloat(original_price)) {
                    req.body.coupon_code = coupon_data[0].coupon_code;
                    cartObj.callApplyCoupon(req, res, function (return_val) {
                        if (typeof (return_val.message) != 'undefined' && return_val.message == 'PROMO_CODE_APPLIED') {

                            result_obj['couponData'] = [return_val.coupon_data];
                            return res.status(200).render('cart', result_obj);
                        } else {

                            result_obj['couponUpdateError'] = return_val.message;
                            result_obj['couponUpdateErrorMessage'] = return_val.message_details;
                            return res.status(200).render('cart', result_obj);
                        }
                    })
                } else {
                    result_obj['couponData'] = coupon_data;
                    return res.status(200).render('cart', result_obj);
                }
            } else {
                return res.status(200).render('cart', result_obj);
            }

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