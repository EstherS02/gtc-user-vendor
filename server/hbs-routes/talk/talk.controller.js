'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const position = require('../../config/position');
const service = require('../../api/service');
const async = require('async');

export function talk(req,res) {
	res.render('talk', {
				title: "Global Trade Connect",
			});
}