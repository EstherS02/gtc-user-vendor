'use strict';

const crypto = require('crypto');
const expressValidator = require('express-validator');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const providers = require('../../config/providers');

export function create(req, res) {
	var queryObj = {};
	req.checkBody('email', 'Missing Query Param').notEmpty();
	req.checkBody('email', 'Please enter a valid email address').isEmail();
	req.checkBody('email', 'Email Address lowercase letters only').isLowercase();
	req.checkBody('password', 'Missing Query Param').notEmpty();

	var errors = req.validationErrors();
	if (errors) {
		res.status(400).send('Missing Query Params');
		return;
	}
	req.body.salt = makeSalt();
	req.body.hashed_pwd = encryptPassword(req);

	var bodyParams = req.body;

	if (req.body.email) {
		queryObj['email'] = req.body.email;
	}

	model['Admin'].findOne({
		where: queryObj
	}).then(function(admin) {
		if (admin) {
			res.status(409).send("Email address already exists");
			return;
		} else {
			model['Admin'].create(bodyParams)
				.then(function(admin) {
					if (admin) {
						res.status(201).send(plainTextResponse(admin));
						return;
					}
				})
				.catch(function(error) {
					if (error) {
						res.status(500).send("Internal server error");
						return;
					}
				});
		}
	}).catch(function(error) {
		if (error) {
			res.status(500).send("Internal server error");
			return
		}
	});
}

export function me(req, res) {
	if (req.admin) {
		res.status(200).send(req.admin);
		return;
	}
}

function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}

function authenticate(plainText, admin) {
	var customBody = {
		body: {
			password: plainText,
			salt: admin.salt,
			email: admin.email
		}
	};
	return encryptPassword(customBody) == admin.hashed_pwd;
}

function makeSalt() {
	return crypto.randomBytes(16).toString('base64');
}

function encryptPassword(req) {
	if (!req.body.password || !req.body.salt)
		return '';
	var saltWithEmail = new Buffer(req.body.salt + req.body.email.toString('base64'), 'base64');
	return crypto.pbkdf2Sync(req.body.password, saltWithEmail, 10000, 64, 'sha1').toString('base64');
}

exports.authenticate = authenticate;