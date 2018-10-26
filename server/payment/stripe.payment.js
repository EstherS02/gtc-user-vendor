'use strict';

const config = require('../config/environment');
const stripe = require("stripe")(config.stripeConfig.keySecret);
const paypal = require('paypal-rest-sdk');

paypal.configure(config.payPalConfig);
  

const STMT_DESCRIPTOR = "GLOBALTRADECONNECT";

let Stripe = {
    createCustomer: function(userObj, source) {
        var custObj = {};
        custObj.email = userObj.email;
        custObj.metadata = {};
        custObj.metadata.user_id = userObj.id;
        custObj.source = source;
        return stripe.customers.create(custObj);
    },
    addCard: function(custId, source, makeDefault) {
        return stripe.customers.createSource(
          custId,
          { source: source }
        ).then(function(card, err) {
            if (err) {
                return Promise.reject(err);
            }
            if (makeDefault === true) {
                return stripe.customers.update(
                    custObj.id,
                    { default_source: source }
                );
            }
            return Promise.resolve(card);
        });
    },
    makeCardDefault: function(custObj, cardObj) {
        return stripe.customers.update(
            custObj.id,
            { default_source: cardObj.id }
        );
    },
    deleteCard: function(custObj, cardObj) {
        return stripe.customers.deleteCard(
            custObj.id, cardObj.id
        );
    },
    chargeCustomerCard: function(custId, cardId, amount, desc, currency, metadata) {
        var chargeObj = {
            customer: custId,
            source: cardId,
            amount: parseInt(amount * 100),
            currency: currency
        }
        if (desc) {
            chargeObj.description = desc;
        }
        if (metadata) {
            chargeObj.metadata = metadata;
        }
        chargeObj.statement_descriptor = STMT_DESCRIPTOR;
        return stripe.charges.create(chargeObj);
    },
    refundCustomerCard: function(chargeId, refundAmount){
        let refundObj = {
            charge: chargeId,
            amount: parseInt(refundAmount * 100)
        }
        return stripe.refunds.create(refundObj);
    },
    vendorStripePayout: function(amount,currency,destination,transfer_group){
      
        let transferObj = {
            amount: amount,
            currency: currency,
            destination: destination,
            transfer_group: transfer_group 
        }
        return stripe.transfers.create(transferObj);
    },
    vendorPaypalPayout: function(recipient_type, amount, currency, destination, order_id){

		var sender_batch_id = Math.random().toString(36).substring(9);

        var create_payout_json = {
            "sender_batch_header": {
                "sender_batch_id": sender_batch_id,
                "email_subject": "You have a payment"
            },
            "items": [
                {
                    "recipient_type": recipient_type,
                    "amount": {
                        "value": amount,
                        "currency": currency
                    },
                    "receiver": destination,
                    "note": "Thank you.",
                    "sender_item_id": order_id
                }
            ]
		};

		return new Promise((resolve, reject) => {
			paypal.payout.create(create_payout_json, function (error, payout) {
				if (error) {
					console.log(error.response);
					return reject(error);
				} else {
					console.log("Create Single Payout Response",payout);
					return resolve(payout);
				}
			});
		});
    }
};

module.exports = Stripe;