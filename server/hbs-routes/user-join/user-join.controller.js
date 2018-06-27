'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const addressCode = require('../../config/address');
const service = require('../../api/service');
const async = require('async');
const populate = require('../../utilities/populate');

export function userJoin(req, res) {
	 var LoggedInUser = {};
	 if (req.user)
		LoggedInUser = req.user;
	res.render('users/user-join', {
		title: "Global Trade Connect",
		LoggedInUser: LoggedInUser
	})
}