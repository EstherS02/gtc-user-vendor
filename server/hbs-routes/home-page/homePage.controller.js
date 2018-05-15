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
