'use strict';

const async = require('async');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
const status = require('../../config/status');
const orderStatus = require('../../config/order_status');
const paymentMethod = require('../../config/payment-method');
const _ = require('lodash');
const moment = require('moment');


const stripe = require('../../payment/stripe.payment');

const CURRENCY = 'usd';

export function makePayment(req, res) {
    let user = req.user;
    let paymentSettingId = req.body.paymentSettingId;

    var checkoutObj;

    var paymentSetting;
    
    var createdOrders;

    processCheckout(req)
    .then(checkoutObjResult => {
        checkoutObj = checkoutObjResult;
        return service.findOneRow('PaymentSetting', {id: paymentSettingId, user_id: user.id}, []);
    }).then(paymentSettingResult => {
        paymentSetting = paymentSettingResult;
        
        var ordersByVendor = checkoutObj.ordersByVendor;
        var orderPromises = [];

        _.forOwn(ordersByVendor, function(order, vendorId) {
            orderPromises.push(createOrder(order));
        });

        return Promise.all(orderPromises);

    }).then(ordersWithItems => {
        createdOrders = ordersWithItems;
        var orderIds = [];
        console.log("ordersWithItems", ordersWithItems);
        for (var i = 0; i < ordersWithItems.length; i++) {
            orderIds.push(ordersWithItems[i].order.id);
        }
        console.log("stripe calling");
        let card_details = JSON.parse(paymentSetting.card_details);
        var desc = "GTC ORDER";
        var metadata = {};
        metadata.orders = JSON.stringify(orderIds);
        console.log("metadata", metadata);
        let amt = checkoutObj.totalPrice['grandTotal'];
        return stripe.chargeCustomerCard(user.stripe_customer_id, card_details.id, amt, desc, CURRENCY, metadata);
    }).then(charge => {
        console.log("charge", charge);
        var paymentModel = {
            paid_date: new Date(charge.created),
            paid_amount: charge.amount / 100.0,
            payment_method: paymentMethod['STRIPE'],
            status: status['ACTIVE'],
            payment_response: JSON.stringify(charge)
        };
        return service.createRow('Payment', paymentModel);
    }).then(paymentRow => {
      let orderPayments = [];
      for (let i = 0; i < createdOrders.length; i++){
        var orderPaymentObj = {
            order_id: createdOrders[i].order.id,
            payment_id: paymentRow.id,
            status: status['ACTIVE'],
            created_on: new Date(),
            created_by: req.user.first_name
        }
        orderPayments.push(service.createRow('OrderPayment', orderPaymentObj));
      }
      return Promise.all(orderPayments);
    }).then(orderPaymentRows => {
        let statusPromises = [];
        for (var i = 0; i < createdOrders.length; i++) {
            createdOrders[i].order.order_status = orderStatus['PROCESSINGORDER'];
            statusPromises.push(service.updateRow('Order', createdOrders[i].order, createdOrders[i].order.id));
        }
        return Promise.all(statusPromises);
      }).then(orderUpdatedRows => {
        let clearCart = [];
        let allCartItems = checkoutObj.cartItems.rows;
        for(let j = 0; j < allCartItems.length; j++){
            console.log(allCartItems[j]);
            clearCart.push(allCartItems[j].id)
        }
        service.destroyManyRow('Cart', clearCart).then(clearedCartRow => {
            if ( !(_.isNull(clearedCartRow))) {
                return res.status(200).send({
                    createdOrders: createdOrders
                });
            } else return res.status(500).send(err);
        });
      }).catch(err => {
        console.log("err3", err);
        if (createdOrders && createdOrders.length > 0) {
            var promises = [];
            for (var i = 0; i < createdOrders.length; i++) {
                createdOrders[i].order.order_status = orderStatus['FAILEDORDER'];
                promises.push(service.updateRow('Order', createdOrders[i].order, createdOrders[i].order.id));
            }
            Promise.all(promises).then(result => {
                return res.status(500).send(err);
            }).catch(error => {
                return res.status(500).send(err);
            });
        } else {
            return res.status(500).send(err);
        }
    });
    
}

function createOrder(orderWithItems) {
    var orderItems = JSON.parse(JSON.stringify(orderWithItems.items));
    delete orderWithItems.items;
    
    var order = orderWithItems;

    return service.createRow('Order', order).then(orderResult => {
        order.id = orderResult.id;
        console.log("order.id", order.id);
        var orderItemsPromises = [];
        for (var i = 0; i < orderItems.length; i++) {
            orderItems[i].order_id = orderResult.id;
            orderItemsPromises.push(createOrderItem(orderItems[i]));
        }
        return Promise.all(orderItemsPromises).then(itemsResults => {
            return Promise.resolve({ order: orderResult, items: itemsResults });
        }).catch(err => {
            return Promise.reject(err);    
        });
    }).catch(err => {
        return Promise.reject(err);
    });
}

function createOrderItem(orderItem) {
    return service.createRow('OrderItem', orderItem);
}

function processCheckout(req) {
    return new Promise((resolve, reject) => {
        var cartItems;
        var marketPlaces;
        var queryObj = {};
        let includeArr = [];

        var user_id = req.user.id;

        queryObj['user_id'] = user_id;

        queryObj['status'] = {
            '$eq': status["ACTIVE"]
        }

        model["Cart"].findAndCountAll({
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
        }).then(function(data) {
            cartItems = JSON.parse(JSON.stringify(data));
            var searchObj = {};
            let includeArr = [];

            searchObj['status'] = {
                '$eq': status["ACTIVE"]
            }

            return service.findRows('Marketplace', searchObj, null, null, 'created_on', "asc", includeArr);
        }).then(function(marketPlaceData) {
            marketPlaces = JSON.parse(JSON.stringify(marketPlaceData));

            var totalItems = cartItems.rows;
            var allMarketPlaces = marketPlaces.rows;
            var totalPrice = {};
            var defaultShipping = 0;

            var totalPriceByVendor = {};

            totalPrice['grandTotal'] = 0;
            totalPriceByVendor['grandTotal'] = 0;

            var seperatedItems = _.groupBy(totalItems, "Product.Marketplace.code");

            var seperatedItemsByVendor = _.groupBy(totalItems, "Product.Vendor.id");

            console.log("seperatedItems", seperatedItems);
            console.log("seperatedItemsByVendor", seperatedItemsByVendor);

            _.forOwn(seperatedItems, function(itemsValue, itemsKey) {
                totalPrice[itemsKey] = {};
                totalPrice[itemsKey]['price'] = 0;
                totalPrice[itemsKey]['shipping'] = 0;
                totalPrice[itemsKey]['total'] = 0;

                for (var i = 0; i < itemsValue.length; i++) {

                    if ((itemsKey == itemsValue[i].Product.Marketplace.code) && itemsValue[i].Product.price) {

                        var calulatedSum = (itemsValue[i].quantity * itemsValue[i].Product.price);

                        var calulatedShippingSum = (itemsValue[i].quantity * itemsValue[i].Product.shipping_cost);

                        totalPrice[itemsKey]['price'] = totalPrice[itemsKey]['price'] + calulatedSum;
                        totalPrice[itemsKey]['shipping'] = totalPrice[itemsKey]['shipping'] + calulatedShippingSum;
                        totalPrice[itemsKey]['total'] = totalPrice[itemsKey]['price'] + totalPrice[itemsKey]['shipping'];
                    }
                }

                totalPrice['grandTotal'] = totalPrice['grandTotal'] + totalPrice[itemsKey]['total'];
            });

            var ordersByVendor = {};
            var checkoutObj = {};

            _.forOwn(seperatedItemsByVendor, function(itemsValue, vendorId) {
                ordersByVendor[vendorId] = {};

                totalPriceByVendor[vendorId] = {};
                totalPriceByVendor[vendorId]['price'] = 0;
                totalPriceByVendor[vendorId]['shipping'] = 0;
                totalPriceByVendor[vendorId]['total'] = 0;

                for (var i = 0; i < itemsValue.length; i++) {

                    if ((vendorId == itemsValue[i].Product.Vendor.id)) {

                        var order = ordersByVendor[vendorId];
                        if (Object.keys(order).length == 0) {
                            // create order
                            order['user_id'] = user_id;
                            order['ordered_date'] = new Date();
                            order['order_status'] = orderStatus['NEWORDER'];
                            order['status'] = status['ACTIVE'];
                            order['billing_address_id'] = req.body.selected_billing_address_id;
                            order['shipping_address_id'] = req.body.selected_shipping_address_id;

                            order['items'] = [];
                        }

                        var calulatedSum = (itemsValue[i].quantity * itemsValue[i].Product.price);

                        var calulatedShippingSum = (itemsValue[i].quantity * itemsValue[i].Product.shipping_cost);

                        totalPriceByVendor[vendorId]['price'] = totalPriceByVendor[vendorId]['price'] + calulatedSum;
                        totalPriceByVendor[vendorId]['shipping'] = totalPriceByVendor[vendorId]['shipping'] + calulatedShippingSum;
                        totalPriceByVendor[vendorId]['total'] = totalPriceByVendor[vendorId]['price'] + totalPriceByVendor[vendorId]['shipping'];

                        var final_price = (calulatedSum + calulatedShippingSum);
                        var orderItem = {
                            product_id: itemsValue[i].Product.id,
                            quantity: itemsValue[i].quantity,
                            subtotal: calulatedSum,
                            shipping_total: calulatedShippingSum,
                            final_price: final_price,
                            status: status['ACTIVE']
                        };

                        order['total_price'] = totalPriceByVendor[vendorId]['total'];
                        order['items'].push(orderItem);
                    }
                }

                totalPriceByVendor['grandTotal'] = totalPriceByVendor['grandTotal'] + totalPriceByVendor[vendorId]['total'];

            });

            console.log("ordersByVendor", ordersByVendor);

            
            checkoutObj.ordersByVendor = ordersByVendor;
            checkoutObj.totalPriceByVendor = totalPriceByVendor;
            checkoutObj.totalPrice = totalPrice;
            checkoutObj.cartItems = cartItems;

            resolve(checkoutObj);

        }).catch(function(error) {
            console.log('Error:::', error);
            reject(error);
        });
    });
}

export function createCard(req, res) {
    let user = req.user;
    var paymentSetting;
    if (_.isUndefined(user.stripe_customer_id) || _.isNull(user.stripe_customer_id)) {
        stripe.createCustomer(user, req.body.token.id)
        .then(customer => {
            user.stripe_customer_id = customer.id;
            let card = customer.sources.data[0];
            //console.log(card);
            return savePaymentSetting(user, card, req.body.isPrimary); 
        }).then(paymentSettingRes => {
            //console.log(paymentSetting);
            paymentSetting = paymentSettingRes;
            return service.updateRow('User', user, user.id);
        }).then(result => {
            //console.log(result);
            return res.status(200).send(paymentSetting);
        }).catch(err => {
            console.log(err);
            return res.status(500).send(err);
        });
    } else {
        stripe.addCard(user.stripe_customer_id, req.body.token.id, req.body.isPrimary)
        .then(card => {
            //console.log("card", card);
            return savePaymentSetting(user, card, req.body.isPrimary); 
        }).then(result => {
            //console.log("result", result);
            paymentSetting = result;
            return res.status(200).send(paymentSetting);
        }).catch(err => {
            console.log("err", err);
            return res.status(500).send(err);
        });
    }
}

function savePaymentSetting(user, card, isPrimary) {    
    let paymentSetting = {
        user_id: user.id,
        stripe_card_id: card.id,
        stripe_customer_id: user.stripe_customer_id,
        card_type: card.brand,
        status: status["ACTIVE"],
        isPrimary: isPrimary,
        card_details: JSON.stringify(card)
    };

    return service.createRow('PaymentSetting', paymentSetting);
}

export function cancelOrder(req, res) {







    return;

}





export function deleteCard(req, res) {
    service.findRow('PaymentSetting', {id: req.body.paymentSettingId}, [])
    .then(paymentSetting => {
        console.log("paymentSetting", paymentSetting);
        if (paymentSetting && paymentSetting.user_id === req.user.id) {
            return service.destroyRow('PaymentSetting', req.body.paymentSettingId);
        } else {
            return Promise.reject('Not Found');
        }
    }).then(result => {
        return res.status(200).send({});
    }).catch(err => {
        return res.status(500).send(err);
    });
}