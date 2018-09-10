'use strict';

const request = require('request');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
const statusCode = require('../../config/status');
const paypal = require('paypal-rest-sdk');
let openIdConnect = paypal.openIdConnect;

paypal.configure({
    'mode': config.payPalOAuth.payPalMode,
    'openid_client_id': config.payPalOAuth.clientId,
    'openid_client_secret': config.payPalOAuth.clientSecret,
    'openid_redirect_uri': config.payPalOAuth.redirectUrl
});

export function paypalVerifyEmailOAuth(req, res) {
    if (!req.query.code) {
        return "error Occurred in verifying paypal email";
    }
    let userId = req.query.state;
    openIdConnect.tokeninfo.create(req.query.code, function(error, tokeninfo) {
        if (error) {
            console.log(error);
        } else {
            openIdConnect.userinfo.get(tokeninfo.access_token, function(error, userinfo) {
                if (error) {
                    console.log(error);
                } else {
                    let updatePayPalId = {
                        'vendor_payout_paypal_email': 'test@gmail.com'
                        //'vendor_payout_paypal_email': userinfo.email
                    }
                    console.log(tokeninfo);
                    console.log(userinfo);
                    return service.updateRow("Vendor", updatePayPalId, userId)
                        .then(function(response) {
                            res.render('twitterCallbackClose', {
                                layout: false,
                                twitterResponseData: 'test'
                            });
                        }).catch(function(err) {
                            console.log(err);
                        });

                }
            });
        }
    });



}