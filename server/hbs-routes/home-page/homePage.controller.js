'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');


export function homePage(req, res) {
	res.render('homePage', {
        title: 'Global Trade Connect'
    });
}

//Below two routes need to be on seperate page
export function checkout(req, res){
    res.render('orderCheckout', {
        title: 'Global Trade Connect'
    });
}

export function vendor(req, res){
    res.render('vendor', {
        title: 'Global Trade Connect'
    });
}