'use strict';

const request = require('request');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');

export function stripeConnect(req,res){

	var bodyParams = {}, queryObj = {};
            var vendorModel = 'Vendor';
    
            var data = {
                client_secret: config.stripeConfig.keySecret,
                code: req.query.code,
                grant_type: "authorization_code"
            }
    
            request.post({
                "headers": { "content-type": "application/json" },
                "url": config.stripeConfig.OAuthUrl,
                body: JSON.stringify(data)
            }, (error, response, body) => {
                if (error) {
                    console.log("Error::", error);
                } else {
                    queryObj = {
                        user_id: req.user.id
                    }

                    var stripeBody = JSON.parse(body);

                    var stripeId = stripeBody.stripe_user_id;

                    	bodyParams = {
                            vendor_payout_stripe_id: stripeId
                        }
                        service.updateRecord(vendorModel, bodyParams, queryObj)
                            .then(function (row) {
                                if (row) {
									console.log("row:",row);
									return res.redirect('/payment-settings');
                                } else {
                                }
                            }).catch(function (error) {
                                if (error) {
									console.log("error:",error);
									return res.redirect('/payment-settings');
                                }
                            })
                }
            }); 
}

export function stripeDisconnect(req,res){

	var vendorId, vendorModel;
	var updatestripeId = {}, disconnectBodyParam = {};

	if (req.body.userId == req.user.id) {

		vendorId = req.user.Vendor.id;
		vendorModel = "Vendor";
		updatestripeId = {
			'vendor_payout_stripe_id': null
		}

		disconnectBodyParam = {
			client_secret: config.stripeConfig.keySecret,
			client_id: config.stripeConfig.clientId,
			stripe_user_id: req.body.stripeId
		}

		request.post({
			"headers": { "content-type": "application/json" },
			"url": config.stripeConfig.disconnectUrl,
			body: JSON.stringify(disconnectBodyParam)
		}, (error, response, body) => {
			if (error) {
				return res.status(500).send({
					"message": "ERROR",
					"messageDetails": "Stripe Disconnect UnSuccessfull with errors",
					"errorDescription": err
				});
			} else {

				return service.updateRow(vendorModel, updatestripeId, vendorId)
					.then(function(response) {	
						return res.status(200).send({
							"message": "SUCCESS",
							"messageDetails": "Stripe Disconnected Successfully"
						});
					}).catch(function(err) {
						return res.status(500).send({
							"message": "ERROR",
							"messageDetails": "Stripe Disconnect UnSuccessfull with errors",
							"errorDescription": err
						});
					});
				}
			}); 		
	} else {
		return res.status(400).send({
			"message": "ERROR",
			"messageDetails": "Bad Request, Not authorized to disconnect"
		});
	}          
}