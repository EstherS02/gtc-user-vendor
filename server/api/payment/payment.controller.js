'use strict';

const async = require('async');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
const status = require('../../config/status');
const _ = require('lodash');
const moment = require('moment');


const stripe = require("stripe")(config.stripeConfig.keySecret);




export function makePayment(req, res){

    console.log("===============", config.stripeConfig.keySecret);


    let stripe_token = "tok_1CoTtNHOMAz31aU0PLGuZoz7";
  
    stripe.customers.create({
        email: 'devansvd7@gmail.com',
        source: stripe_token
    })
    .then(customer =>
      stripe.charges.create({
        amount: 200,
        description: "Devan Test charge",
        currency: "usd",
        customer: customer.id,
        metadata: { order_id: 6735 }
      }))
    .then(charge => res.send(charge));
    

}


