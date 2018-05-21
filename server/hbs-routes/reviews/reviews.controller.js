'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');
import series from 'async/series';
var async = require('async');


export function reviews(req, res) {
	res.render('reviews', {
        title: 'Global Trade Connect'
    });
}