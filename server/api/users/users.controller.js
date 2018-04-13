'use strict';

const crypto = require('crypto');
const expressValidator = require('express-validator');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');

export function create(req, res) {
	req.checkBody('role', 'Missing Query Param').notEmpty();
	req.checkBody('email', 'Missing Query Param').notEmpty();
	req.checkBody('email', 'Please enter a valid email address').isEmail();
	req.checkBody('email', 'Email Address lowercase letters only').isLowercase();
	req.checkBody('password', 'Missing Query Param').notEmpty();
	req.checkBody('first_name', 'Missing Query Param').notEmpty();
	req.checkBody('status', 'Missing Query Param').notEmpty();
	req.checkBody('email_verified', 'Missing Query Param').notEmpty();

	var errors = req.validationErrors();
	if (errors) {
		res.status(400).send('Missing Query Params');
		return;
	}
	req.body.salt = makeSalt();
	req.body.hashed_pwd = encryptPassword(req);

	const bodyParams = req.body;
	bodyParams['created_on'] = new Date();

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