'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const addressCode = require('../../config/address');
const service = require('../../api/service');
const async = require('async');
const populate = require('../../utilities/populate');

export function userVerify(req, res) {
	res.render('user-verify', {
		title: "Global Trade Connect"
	})
}