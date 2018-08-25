'use strict';
// import Handlebars from 'handlebars';
const async = require('async');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
const Handlebars = require('handlebars');
const populate = require('../../utilities/populate');
const status = require('../../config/status');
const orderStatus = require('../../config/order_status');
const paymentMethod = require('../../config/payment-method');
const _ = require('lodash');
const moment = require('moment');
const ORDER_ITEM_STATUS = require('../../config/order-item-status');
const ORDER_PAYMENT_TYPE = require('../../config/order-payment-type');
const uuidv1 = require('uuid/v1');
const sendEmail = require('../../agenda/send-email');


const stripe = require('../../payment/stripe.payment');

const CURRENCY = 'usd';

export function makePayment(req, res) {
    let user = req.user;
    let paymentSettingId = req.body.paymentSettingId;

    var checkoutObj;

    var paymentSetting;

    var createdOrders;

    var orderIdStore = [];

    processCheckout(req)
        .then(checkoutObjResult => {
            checkoutObj = checkoutObjResult;
            return service.findOneRow('PaymentSetting', {
                id: paymentSettingId,
                user_id: user.id
            }, []);
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
            for (let i = 0; i < createdOrders.length; i++) {
                var orderPaymentObj = {
                    order_id: createdOrders[i].order.id,
                    payment_id: paymentRow.id,
                    order_payment_type: ORDER_PAYMENT_TYPE['ORDER_PAYMENT'],
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
                createdOrders[i].order.order_status = orderStatus['NEWORDER'];
                createdOrders[i].order.gtc_fees = 1.00;
                orderIdStore.push(createdOrders[i].order.id);
                statusPromises.push(service.updateRow('Order', createdOrders[i].order, createdOrders[i].order.id));
            }
            return Promise.all(statusPromises);
        }).then(orderUpdatedRows => {
            let clearCart = [];
            let allCartItems = checkoutObj.cartItems.rows;
            for (let j = 0; j < allCartItems.length; j++) {
                clearCart.push(allCartItems[j].id)
            }
            sendOrderMail(orderIdStore, req.user);
            service.destroyManyRow('Cart', clearCart).then(clearedCartRow => {
                if (!(_.isNull(clearedCartRow))) {
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
                    createdOrders[i].order.gtc_fees = 1.00;
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
    order.gtc_fees = 1.00;

    return service.createRow('Order', order).then(orderResult => {
        order.id = orderResult.id;
        console.log("order.id", order.id);
        var orderItemsPromises = [];
        for (var i = 0; i < orderItems.length; i++) {
            orderItems[i].order_id = orderResult.id;
            orderItemsPromises.push(createOrderItem(orderItems[i]));
        }
        return Promise.all(orderItemsPromises).then(itemsResults => {
            return Promise.resolve({
                order: orderResult,
                items: itemsResults
            });
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
                            order['invoice_id'] = uuidv1();
                            order['purchase_order_id'] = 'PO-' + uuidv1();
                            order['created_by'] = req.user.first_name;
                            order['created_on'] = new Date();
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


function resMessage(message, messageDetails) {
    return {
        message: message,
        messageDetails: messageDetails
    };
}

export function cancelOrder(req, res) {
    if (!req.body)
        return res.status(400).send(resMessage("BAD_REQUEST", "Missing one or more required Parameters"));
    if (!req.body.reason_for_cancellation)
        return res.status(400).send(resMessage("BAD_REQUEST", "No Reason for cancellation"));

    let orderItem, paymentObj, refundObj;

    processCancelOrder(req)
        .then(orderItemObj => {
            orderItem = orderItemObj;
            let includeArray = [];
            includeArray = populate.populateData("Payment");
            let orderPaymentQueryObj = {
                order_id: orderItemObj.order_id,
                order_payment_type: ORDER_PAYMENT_TYPE['ORDER_PAYMENT']
            }
            return service.findRow('OrderPayment', orderPaymentQueryObj, includeArray);
        }).then(paymentRow => {
            paymentObj = JSON.parse(JSON.stringify(paymentRow));
            let chargedPaymentRes = JSON.parse(paymentObj.Payment.payment_response);
            let refundAmt = parseInt(orderItem.final_price);
            return stripe.refundCustomerCard(chargedPaymentRes.id, refundAmt);
        }).then(refundRow => {
            refundObj = refundRow;
            let paymentModel = {
                refund_date: new Date(refundRow.created),
                refund_amount: refundRow.amount / 100.0,
                payment_method: paymentMethod['STRIPE'],
                status: status['ACTIVE'],
                payment_response: JSON.stringify(refundRow),
                created_by: req.user.first_name,
                created_on: new Date()
            };
            return service.createRow('Payment', paymentModel);
        }).then(createdPaymentRow => {
            let orderPaymentModel = {
                order_id: orderItem.order_id,
                payment_id: createdPaymentRow.id,
                order_payment_type: ORDER_PAYMENT_TYPE['REFUND'],
                status: status['ACTIVE'],
                created_by: req.user.first_name,
                created_on: new Date()
            }
            return service.createRow('OrderPayment', orderPaymentModel);
        }).then(createdOrderPaymentRow => {
            let updateOrderItem = {
                reason_for_cancellation: req.body.reason_for_cancellation,
                cancelled_on: new Date(),
                order_item_status: ORDER_ITEM_STATUS['ORDER_CANCELLED_AND_REFUND_INITIATED'],
                last_updated_by: req.user.first_name,
                last_updated_on: new Date()
            }
            return service.updateRow('OrderItem', updateOrderItem, orderItem.id);
        }).then(successPromise => {
            return res.status(200).send(resMessage("SUCCESS", "Order Cancelled and Refund Initiated. Credited to bank account to 5 to 7 bussiness days"));
        }).catch(error => {
            console.log("Error", error)
            return res.status(500).send(error);
        });

}

function processCancelOrder(req) {
    return new Promise((resolve, reject) => {
        let includeArray = [];
        includeArray = populate.populateData("Order,Product");
        service.findRow('OrderItem', {
                id: req.params.orderItemId
            }, includeArray)
            .then(orderItemRow => {
                orderItemRow = JSON.parse(JSON.stringify(orderItemRow));
                if (orderItemRow.order_item_status === ORDER_ITEM_STATUS['ORDER_CANCELLED_AND_REFUND_INITIATED'] || orderItemRow.order_item_status === ORDER_ITEM_STATUS['REFUND_FAILED'])
                    return reject(resMessage("BAD_REQUEST", "Refund already processing"));

                if (orderItemRow.Order.user_id === req.user.id)
                    return resolve(orderItemRow);
                else if (req.user.VendorStatus && req.user.Vendor && (orderItemRow.Product.vendor_id === req.user.Vendor.id))
                    return resolve(orderItemRow);
                else
                    return reject(resMessage("BAD_REQUEST", "Access Denied, Not Authorized to cancel the order"));
            }).catch(err => {
                return reject(resMessage("BAD_REQUEST", "Order item Not Found"));
            });

    });
}

export function deleteCard(req, res) {
    service.findRow('PaymentSetting', {
            id: req.body.paymentSettingId
        }, [])
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

export function sendOrderMail(orderIdStore, user) {
    var orderIdStore = orderIdStore;
    var includeArr = [{
        model: model['OrderItem'],
        include: [{
            model: model['Product'],
        }]
    }, {
        model: model['Address'],
        as: 'shippingAddress',
        include: [{
            model: model['State']
        }, {
            model: model['Country']
        }, ]
    }]
    console.log(orderIdStore);
    var queryObj = {
        id: orderIdStore
    }
    var field = 'created_on';
    var order = "asc";
    var orderItemMail = service.findAllRows('Order', includeArr, queryObj, 0, null, field, order).then(function(OrderList) {
        if (OrderList) {
            var user_email = user.email;
            var orderNew = [];
            var queryObjEmailTemplate = {};
            var emailTemplateModel = "EmailTemplate";
            queryObjEmailTemplate['name'] = config.email.templates.userOrderDetail;
            service.findOneRow(emailTemplateModel, queryObjEmailTemplate)
                .then(function(response) {
                    if (response) {
                        var email = user_email;
                        var subject = response.subject.replace('%ORDER_TYPE%', 'Order Status');
                        var body;
                        body = response.body.replace('%ORDER_TYPE%', 'Order Status');
                        _.forOwn(OrderList.rows, function(orders) {
                            body = body.replace('%COMPANY_NAME%', orders.shippingAddress.company_name ? orders.shippingAddress.company_name : '');
                            body = body.replace('%ADDRESS_LINE_1%', orders.shippingAddress.address_line1 ? orders.shippingAddress.address_line1 : '');
                            body = body.replace('%ADDRESS_LINE_2%', orders.shippingAddressaddress_line2 ? orders.shippingAddress.address_line2 : '');
                            body = body.replace('%CITY%', orders.shippingAddress.city ? orders.shippingAddress.city : '');
                            body = body.replace('%STATE%', orders.shippingAddress.State.name ? orders.shippingAddress.State.name : '');
                            body = body.replace('%COUNTRY%', orders.shippingAddress.Country.name ? orders.shippingAddress.Country.name : '');
                            orderNew.push(orders);
                        });
                        var template = Handlebars.compile(body);
                        var data = {
                            order: orderNew
                        };
                        var result = template(data);
                        sendEmail({
                            to: email,
                            subject: subject,
                            html: result
                        });
                        return;
                    } else {
                        return;
                    }
                }).catch(function(error) {
                    console.log('Error :::', error);
                    return;
                });
        }

    }).catch(function(error) {
        console.log('Error :::', error);
        return;
    });
}