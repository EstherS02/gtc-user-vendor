'use strict';

const config = require('../config/environment');
const stripe = require("stripe")(config.stripeConfig.keySecret);

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
    }
};

module.exports = Stripe;