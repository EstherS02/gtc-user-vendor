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
        return errorResponse({
            error: 'invalid Paypal Email'
        });
    }
    let userId = req.query.state;
    openIdConnect.tokeninfo.create(req.query.code, function(error, tokeninfo) {
        if (error) {
            return errorResponse(error);
        } else {
            openIdConnect.userinfo.get(tokeninfo.access_token, function(error, userinfo) {
                if (error) {
                    return errorResponse(error);
                } else {
                    let updatePayPalId = {
                        'vendor_payout_paypal_email': 'test@gmail.com'
                        //'vendor_payout_paypal_email': userinfo.email
                    }
                    return service.updateRow("Vendor", updatePayPalId, userId)
                        .then(function(response) {
                            return res.render('window-popup-close', {
                                layout: false,
                                popupResponseData: {
                                    message: "SUCCESS",
                                    messageDetails: "Paypal Email id is successfully connected"
                                }
                            });
                        }).catch(function(err) {
                            return errorResponse(err);
                        });

                }
            });
        }
    });
}

function errorResponse(error) {
    return res.render('window-popup-close', {
        layout: false,
        popupResponseData: {
            message: "ERROR",
            messageDetails: 'Failed to connect Paypal Email Id',
            errorDetails: error
        }
    });
}