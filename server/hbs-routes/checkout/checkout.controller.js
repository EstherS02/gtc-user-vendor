'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');


export function checkout(req, res){
    res.render('orderCheckout', {
        title: 'Global Trade Connect'
    });
}


