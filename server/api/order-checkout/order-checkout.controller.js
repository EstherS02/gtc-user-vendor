'use strict';

const async = require('async');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
const status = require('../../config/status');
const discount = require('../../config/discount');
const _ = require('lodash');
const moment = require('moment');

export function addCustomerInformation(req, res){

    console.log(req.body)
    
    validateAddressBody(req, res);
    
    let errors = req.validationErrors();

    if(errors){
        return res.status(400).send(errors);
    }


    

}


function validateAddressBody(req, res){
    req.checkBody('billing_address.billing_first_name', 'Billing Address First Name is Required').notEmpty();
    req.checkBody('billing_address.billing_last_name', 'Billing Address Last Name is Required').notEmpty();
    req.checkBody('billing_address.billing_addressline1', 'Billing Address Line 1 is Required').notEmpty();
    req.checkBody('billing_address.billing_addressline2', 'Billing Address Line 2 is Required').notEmpty();
    req.checkBody('billing_address.billing_city', 'Billing Address City is Required').notEmpty();
    req.checkBody('billing_address.billing_country', 'Billing Address Country is Required').notEmpty();
    req.checkBody('billing_address.billing_state', 'Billing Address State is Required').notEmpty();
    req.checkBody('billing_address.billing_postal', 'Billing Address Postal code is Required').notEmpty();
    req.checkBody('billing_address.billing_phone', 'Billing Address Phone Number is Required').notEmpty();
    
    req.checkBody('shipping_address.shipping_first_name', 'Shipping Address First Name is Required').notEmpty();
    req.checkBody('shipping_address.shipping_last_name', 'Shipping Address Last Name is Required').notEmpty();
    req.checkBody('shipping_address.shipping_addressline1', 'Shipping Address Line 1 is Required').notEmpty();
    req.checkBody('shipping_address.shipping_addressline2', 'Shipping Address Line 2 is Required').notEmpty();
    req.checkBody('shipping_address.shipping_city', 'Shipping Address City is Required').notEmpty();
    req.checkBody('shipping_address.shipping_country', 'Shipping Address Country is Required').notEmpty();
    req.checkBody('shipping_address.shipping_state', 'Shipping Address State is Required').notEmpty();
    req.checkBody('shipping_address.shipping_postal', 'Shipping Address Postal code is Required').notEmpty();
    req.checkBody('shipping_address.shipping_phone', 'Shipping Address Phone Number is Required').notEmpty();

    return;
}
