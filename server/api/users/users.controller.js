'use strict';

const crypto = require('crypto');
const uuid = require('node-uuid');
const expressValidator = require('express-validator');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const providers = require('../../config/providers');

export function create(req, res) {
	var queryObj = {};
	var randomCode = uuid.v1();

	req.checkBody('first_name', 'Missing Query Param').notEmpty();
	req.checkBody('provider', 'Missing Query Param').notEmpty();
	req.checkBody('role', 'Missing Query Param').notEmpty();
	req.checkBody('status', 'Missing Query Param').notEmpty();
	req.checkBody('email_verified', 'Missing Query Param').notEmpty();

	if (providers[req.body.provider] == providers[1]) {
		req.checkBody('email', 'Missing Query Param').notEmpty();
		req.checkBody('email', 'Please enter a valid email address').isEmail();
		req.checkBody('email', 'Email Address lowercase letters only').isLowercase();
		req.checkBody('password', 'Missing Query Param').notEmpty();
	}

	var errors = req.validationErrors();
	if (errors) {
		res.status(400).send('Missing Query Params');
		return;
	}
	req.body.salt = makeSalt();
	req.body.hashed_pwd = encryptPassword(req);

	var bodyParams = req.body;
	bodyParams['created_on'] = new Date();

	if (req.body.email) {
		queryObj['email'] = req.body.email;
	}

	model['User'].findOne({
		where: queryObj
	}).then(function(user) {
		if (user) {
			if (providers[user.provider] != providers[1]) {
				console.log('social login');
				return;
			} else {
				res.status(409).send("Email address already exists");
				return;
			}
		} else {
			if (req.body.email_verified == 0) {
				bodyParams['email_verified_token'] = randomCode;
				bodyParams['email_verified_token_generated'] = Date.now();
			}
			model['User'].create(bodyParams)
				.then(function(row) {
					if (row) {
						res.status(201).send(plainTextResponse(row));
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
	if (req.user) {
		res.status(200).send(req.user);
		return;
	}
}

function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}

function authenticate(plainText, user) {
	var customBody = {
		body: {
			password: plainText,
			salt: user.salt,
			email: user.email
		}
	};
	return encryptPassword(customBody) == user.hashed_pwd;
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