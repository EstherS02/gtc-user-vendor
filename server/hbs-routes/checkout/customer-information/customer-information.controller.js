'use strict';

const async = require('async');
const _ = require('lodash');
const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const reference = require('../../../config/model-reference');
const status = require('../../../config/status');
const service = require('../../../api/service');
const populate = require('../../../utilities/populate');
const ADDRESS_TYPE = require('../../../config/address');



export function customerInformation(req, res) {
    let LoggedInUser = {};

    if (req.user)
        LoggedInUser = req.user;

    let user_id = LoggedInUser.id;

    async.series({
        address : function(cb) {

            let searchObj = {};
            let includeArr = [];

            //includeArr = populate.populateData("User,Country,State");
            includeArr = [
                { "model" : model["User"],
                    attributes: {
                        exclude: ['hashed_pwd', 'salt', 'email_verified_token', 'email_verified_token_generated', 'forgot_password_token', 'forgot_password_token_generated']
                    }
            },
                { "model" : model["Country"] },
                { "model" : model["State"] }
            ]

            searchObj['status'] = {
                '$eq': status["ACTIVE"]
            }

            searchObj['user_id'] = user_id;

            return service.findRows('Address', searchObj, null, null, 'address_type', "asc", includeArr)
                .then(function(addressData) {
                    addressData = JSON.parse(JSON.stringify(addressData));
                    return cb(null, addressData.rows)
                }).catch(function(error) {
                    console.log('Error :::', error);
                    return cb(error);
                });    
        },

        country : function(cb) {

            let searchObj = {};
            let includeArr = [];

           // includeArr = populate.populateData("User,Country,State");

            searchObj['status'] = {
                '$eq': status["ACTIVE"]
            }

            return service.findRows('Country', searchObj, null, null, 'name', "asc", includeArr)
                .then(function(countryData) {
                    countryData = JSON.parse(JSON.stringify(countryData));
                    return cb(null, countryData.rows)
                }).catch(function(error) {
                    console.log('Error :::', error);
                    return cb(error);
                });    
        },

        state : function(cb) {

            let searchObj = {};
            let includeArr = [];

            includeArr = populate.populateData("Country");

            searchObj['status'] = {
                '$eq': status["ACTIVE"]
            }

            return service.findRows('State', searchObj, null, null, 'name', "asc", includeArr)
                .then(function(stateData) {
                    stateData = JSON.parse(JSON.stringify(stateData));
                    return cb(null, stateData.rows)
                }).catch(function(error) {
                    console.log('Error :::', error);
                    return cb(error);
                });    
        }

    }, function(err, results) {
        
            let billing_address = [], shipping_address = [];

            let splitAddress = _.groupBy(results.address, "address_type");

                if(splitAddress && splitAddress[ADDRESS_TYPE['BILLINGADDRESS']])
                    billing_address = splitAddress[ADDRESS_TYPE['BILLINGADDRESS']];
                if(splitAddress && splitAddress[ADDRESS_TYPE['SHIPPINGADDRESS']])
                    shipping_address = splitAddress[ADDRESS_TYPE['SHIPPINGADDRESS']];

/* 
            return res.status(200).send({
                title: "Global Trade Connect",
                LoggedInUser: LoggedInUser,
                billing_address: billing_address,
                shipping_address: shipping_address,
                state: results.state,
                country: results.country
            }) */

            console.log(billing_address)

        

        return res.status(200).render('checkout/customer-information', {
            title: "Global Trade Connect",
            LoggedInUser: LoggedInUser,
            billing_address: billing_address,
            shipping_address: shipping_address,
            state: results.state,
            country: results.country
        });      
    });

}