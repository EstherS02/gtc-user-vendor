'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
var async = require('async');
const vendorPlan = require('../../config/gtc-plan');

export function messages(req, res) {
	res.render('vendorNav/messages');	
}