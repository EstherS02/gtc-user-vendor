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
        return errorResponse(res, {
            error: 'invalid Paypal Email'
        });
    }
    let vendorId = req.user.Vendor.id;
    openIdConnect.tokeninfo.create(req.query.code, function(error, tokeninfo) {
        if (error) {
            return errorResponse(res, error);
        } else {
            openIdConnect.userinfo.get(tokeninfo.access_token, function(error, userinfo) {
                if (error) {
                    return errorResponse(res, error);
                } else {
                    console.log(userinfo)
                    let updatePayPalId = {
                        'vendor_payout_paypal_email': userinfo.email
                    }
                    return service.updateRow("Vendor", updatePayPalId, vendorId)
                        .then(function(response) {
                            return res.render('paypal-callback-close', {
                                layout: false,
                                popupResponseData: {
                                    message: "SUCCESS",
                                    messageDetails: "Paypal Email id is successfully connected"
                                }
                            });
                        }).catch(function(err) {
                            return errorResponse(res, err);
                        });

                }
            });
        }
    });
}

export function payPalEmailDisconnect(req, res) {
    if (req.body.userId == req.user.id) {
        let vendorId = req.user.Vendor.id;
        let updatePayPalId = {
            'vendor_payout_paypal_email': null
        }
        return service.updateRow("Vendor", updatePayPalId, vendorId)
            .then(function(response) {
                return res.status(200).send({
                    "message": "SUCCESS",
                    "messageDetails": "PayPal Email Disconnected Successfully"
                });
            }).catch(function(err) {
                return res.status(500).send({
                    "message": "ERROR",
                    "messageDetails": "PayPal Email Disconnect UnSuccessfull with errors",
                    "errorDescription": err
                });
            });
    } else {
        return res.status(400).send({
            "message": "ERROR",
            "messageDetails": "Bad Request, Not authorized to disconnect"
        });
    }

}

function errorResponse(res, error) {
    return res.render('paypal-callback-close', {
        layout: false,
        popupResponseData: {
            message: "ERROR",
            messageDetails: 'Failed to connect Paypal Email Id',
            errorDetails: error
        }
    });
}