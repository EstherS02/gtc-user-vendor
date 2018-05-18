'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');


export function editListings(req, res) {
	res.render('edit-listings', {
        title: 'Global Trade Connect'
    });
}