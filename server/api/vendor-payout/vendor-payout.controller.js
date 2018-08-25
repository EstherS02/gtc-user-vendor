import { promise } from 'selenium-webdriver';

const sequelize = require('sequelize');
const model = require('../../sqldb/model-connect');
const config = require('../../config/environment');
const statusCode = require('../../config/status');
const service = require('../service');
const orderStatus = require('../../config/order_status');
const paymentType = require('../../config/order-payment-type');
const moment = require('moment');
const _ = require('lodash');
const stripe = require('../../payment/stripe.payment');
const sendEmail = require('../../agenda/send-email');
const populate = require('../../utilities/populate');
const paymentMethod = require('../../config/payment-method');
const escrowAction = require('../../config/escrow-action');

const CURRENCY = 'usd';

export function vendorPayout(req, res) {

    var orderPaymentModel = 'OrderPayment';
    var includeArray = [], orderPaymentQueryObj = {}, payoutDate;

    payoutDate = moment(new Date()).add(-5, 'days');

    orderPaymentQueryObj['status'] = statusCode["ACTIVE"];
    orderPaymentQueryObj['order_payment_type'] = paymentType["ORDER_PAYMENT"];

    includeArray = [
        {
            "model": model['Order'],
            where: {
                status: statusCode["ACTIVE"],
                order_status: orderStatus["DISPATCHEDORDER"],
                shipped_on: {
                    '$lt': payoutDate
                },
            },
            include: [
                {
                    "model": model['Product'],
                    where: {
                        status: statusCode["ACTIVE"]
                    },
                    include: [
                        {
                            "model": model['Vendor'],
                            where: {
                                status: statusCode["ACTIVE"]
                            },
                            attribute: ['id', 'user_id'],
                        }
                    ],
                    atrribute: ['id', 'vendor_id']
                }
            ]
        }
    ];

    model[orderPaymentModel].findAll({
        where: orderPaymentQueryObj,
        include: includeArray
    }).then(function (rows) {

        var escrowPromises = [];
        _.forOwn(rows, function (order) {

            escrowPromises.push(checkpaymentEscrow(order));
        });

        return Promise.all(escrowPromises);
    }).then(function (paymentInfo) {
        return res.status(200).send(paymentInfo);

    }).catch(function (error) {
        return res.status(400).send(error);
    });
};

function checkpaymentEscrow(order) {

    var paymentEscrowQueryObj = {}, payoutAmount, payoutVendor, payoutOrder;
    var orderPaymentEscrowModel = 'OrderPaymentEscrow';
    var payoutVendorPromises = [];


    paymentEscrowQueryObj['status'] = statusCode["ACTIVE"];
    paymentEscrowQueryObj['action'] = escrowAction["TRANSFERED"];
    paymentEscrowQueryObj['order_id'] = order.order_id;

    return service.findRow(orderPaymentEscrowModel, paymentEscrowQueryObj, [])
        .then(function (row) {
            if (row) {
                return;
            } else {
                payoutAmount = order.Order.total_price - order.Order.gtc_fees;
                payoutVendor = order.Order.Products[0].Vendor.id;
                payoutOrder = order.order_id;

                payoutVendorPromises.push(fetchPayoutVendorInfo(payoutVendor, payoutAmount, payoutOrder));
                return Promise.all(payoutVendorPromises);
                
                /*then(function (payoutVendorInfoResults) {
                    return Promise.resolve(payoutVendorInfoResults);
                }).catch(function (error) {
                    return Promise.reject(error);
                })*/
            }
        }).catch(function (error) {
            return Promise.reject(error);
        })
};

function fetchPayoutVendorInfo(payoutVendor, payoutAmount, payoutOrder) {

    var includeArr = populate.populateData("User");
    var vendorModel = 'Vendor';
    var stripePromises = [];
    var vendorInfo ={};

    return service.findIdRow(vendorModel, payoutVendor, includeArr)
        .then(function (vendor) {
            if (vendor) {
                vendorInfo=vendor;
                if (vendor.vendor_payout_stripe_id) {

                   stripePromises.push(stripe.vendorPayout(payoutAmount, CURRENCY, vendor.vendor_payout_stripe_id, payoutOrder));
                   return Promise.all(stripePromises);

                } else {
                  //stripeConnectMail(vendor);
                    return; 
                }
            } else {
                return;
            }
        })
        .then(function (payoutDetails) {
            if(payoutDetails){ 
                var paymentPromises = [];

                var paymentObj = {
                      payout_created_date: new Date(payoutDetails[0].created),
                      payout_amount: payoutAmount,
                      payment_method: paymentMethod['STRIPE'],
                      status: statusCode['ACTIVE'],
                      payment_response: JSON.stringify(payoutDetails)
                  };

                  paymentPromises.push(createPaymentRow(paymentObj));
                  return Promise.all(paymentPromises);
            }
        })
        .then(function (paymentRow) {

            if(paymentRow){
               
                var orderPaymentEscrowObj = {
                    payment_id: paymentRow[0].id,
                    order_id: payoutOrder,
                    status: statusCode["ACTIVE"],
                    action: escrowAction["TRANSFERED"]
                }

                return service.createRow('OrderPaymentEscrow', orderPaymentEscrowObj)
                    .then(function (orderPaymentEscrowObj) {
                     
                     payoutMail(vendorInfo, payoutOrder, payoutAmount);
                     return Promise.resolve(orderPaymentEscrowObj);
                    

                    }).catch(function (error) {
                        return Promise.reject(error);
                    })
            }        
          })

        .catch(function (error) {
            return Promise.reject(error);
        })
}

function createPaymentRow(paymentObj) {
    return service.createRow('Payment', paymentObj);
}

function stripeConnectMail(vendor) {

    var emailTemplateQueryObj = {};
    var emailTemplateModel = "EmailTemplate";
    emailTemplateQueryObj['name'] = config.email.templates.stripeConnectEmail;

    return service.findOneRow('EmailTemplate', emailTemplateQueryObj)
        .then(function (response) {
            if (response) {
                var username = vendor.vendor_name;
                var email = vendor.User.email;

                var subject = response.subject;
                var body  = response.body;

                sendEmail({
                    to: email,
                    subject: subject,
                    html: body
                });
                return;
            } else {
                return;
            }

        }).catch(function (error) {
            return;
        });
}

function payoutMail(vendor,payoutOrder,payoutAmount) {

    var emailTemplateQueryObj = {};
    var emailTemplateModel = "EmailTemplate";
    emailTemplateQueryObj['name'] = config.email.templates.payoutMail;

    return service.findOneRow('EmailTemplate', emailTemplateQueryObj)
        .then(function (response) {
            if (response) {
                var username = vendor.vendor_name;
                var email = vendor.User.email;

                var subject = response.subject;
                var body;
                body = response.body.replace('%USERNAME%', username);
                body = body.replace('%ORDERID%',payoutOrder);
                body = body.replace('%AMOUNT%',payoutAmount);   
                body = body.replace('%CURRENCY%',CURRENCY);
                body = body.replace('%CREATED_DATE%',date); 

                sendEmail({
                    to: email,
                    subject: subject,
                    html: body
                });
                return;
            } else {
                return;
            }

        }).catch(function (error) {
            return;
        });
}






