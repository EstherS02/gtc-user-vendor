
const sequelize = require('sequelize');
const model = require('../../sqldb/model-connect');
const statusCode = require('../../config/status');
const service = require('../service');
const orderStatus = require('../../config/order_status');
const vendorPayoutAction = require('../../config/vendor-payout-action');
const paymentType = require('../../config/order-payment-type');
const moment = require('moment');
const _ = require('lodash');

export function vendorPayout(req, res) {

    var orderPaymentModel = 'OrderPayment';
    var includeArray = [], queryObj={}, paymentEscrowQueryObj={};
    var payoutDate, payoutAmount, payoutVendor;

    payoutDate = moment(new Date()).add(-5, 'days');

    queryObj['status'] = statusCode["ACTIVE"];
    queryObj['order_payment_type'] = paymentType["ORDER_PAYMENT"];

    paymentEscrowQueryObj['status'] = statusCode["ACTIVE"];
    paymentEscrowQueryObj['action'] = vendorPayoutAction["VENDOR_PAID"];
    
    includeArray = [
        {
            "model": model['Order'],
            where: {
                status: statusCode["ACTIVE"],
                order_status: orderStatus["DISPATCHEDORDER"],
                shipped_on:{
                    '$lt': payoutDate
                },
            },
            include:[
                {
                    "model": model['Product'],
                    where:{
                        status: statusCode["ACTIVE"]
                    },
                    include:[
                          {
                            "model": model['Vendor'],
                            where:{
                                status: statusCode["ACTIVE"]
                            },
                            attribute: ['id', 'user_id'],
                          }
                    ],
                    atrribute: ['id','vendor_id']
                }
            ]
        }
    ];

    model[orderPaymentModel].findAll({
        where: queryObj,        
        include:includeArray
    })
    .then(function (rows) {
         
        var escrowPromises =[];
        _.forOwn(rows, function(order) {

            escrowPromises.push(checkpaymentEscrow(order,paymentEscrowQueryObj));
        });
      
        return Promise.all(escrowPromises);
     }).then(function(paymentInfo){

        return res.status(200).send(paymentInfo);

     }).catch(function (error) {
            return res.status(400).send(error);
    });
   
};

function checkpaymentEscrow(order,paymentEscrowQueryObj){

    var PaymentSettingQueryObj={},payoutAmount, payoutVendor;
    var OrderPaymentEscrowModel = 'OrderPaymentEscrow';
    var PaymentSettingPromises =[];

    paymentEscrowQueryObj['order_id'] = order.order_id;
    payoutAmount = order.Order.total_price - order.Order.gtc_fees;
    payoutVendor = order.Order.Products[0].Vendor.user_id;

    return service.findRow(OrderPaymentEscrowModel,paymentEscrowQueryObj,[])
    .then(function(row){
        if(row){
            return;
        }else{
            PaymentSettingQueryObj['status'] = statusCode["ACTIVE"];
            PaymentSettingQueryObj['is_primary'] = 1;
            PaymentSettingQueryObj['user_id'] = payoutVendor;

           
            PaymentSettingPromises.push(fetchPaymentInfo(PaymentSettingQueryObj));
            return Promise.all(PaymentSettingPromises).then(function(paymentInfoResults){
                return Promise.resolve({
                    paymentInfoResults:paymentInfoResults
                })
            }).catch(function(error){
                return Promise.reject(error);
            })
        }
    }).catch(function(error){
        return Promise.reject(error);
    })
};

function fetchPaymentInfo(PaymentSettingQueryObj){

    var PaymentSettingModel = 'PaymentSetting';

    return service.findOneRow(PaymentSettingModel,PaymentSettingQueryObj)
     .then(function(row){
         if(row){
            return Promise.resolve(row)
         }
         else{
            return Promise.resolve({
                paymentInfoResults: "Please add Primary Card in your account inorder to process payment"
            })
            
         }
     })
}





