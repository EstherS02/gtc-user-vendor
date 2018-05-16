'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');


export function cart(req, res) {
	res.render('cart', {
        title: 'Global Trade Connect'
    });
}
