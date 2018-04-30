'use strict';

const crypto = require('crypto');
const expressValidator = require('express-validator');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const providers = require('../../config/providers');
const status = require('../../config/status');
const roles = require('../../config/roles');

export function create(req, res) {

	var queryObj = {};

	req.checkBody('email', 'Missing Query Param').notEmpty();
	req.checkBody('email', 'Please enter a valid email address').isEmail();
	req.checkBody('email', 'Email Address lowercase letters only').isLowercase();
	req.checkBody('password', 'Missing Query Param').notEmpty();
	req.checkBody('first_name', 'Missing Query Param').notEmpty();

	var errors = req.validationErrors();
	if (errors) {
		res.status(400).send('Missing Query Params');
		return;
	}

	req.body.salt = makeSalt();
	req.body.hashed_pwd = encryptPassword(req);

	if (req.body.email) {
		queryObj['email'] = req.body.email;
	}
	const bodyParams = req.body;

	model['User'].findOne({
		where: queryObj
	}).then(function(user) {
		if (user) {
			res.status(409).send("Email address already exists");
			return;
		} else {
			bodyParams["provider"] = providers["OWN"];
			bodyParams["status"] = status["ACTIVE"];
			bodyParams["role"] = roles["ADMIN"];
			bodyParams["email_verified"] = 0;

			model['User'].create(bodyParams)
				.then(function(user) {
					if (user) {
						const rspUser = plainTextResponse(user);
						model['Admin'].create({
							user_id: rspUser.id
						}).then(function(admin) {
							if (admin) {
								delete rspUser.salt;
								delete rspUser.hashed_pwd;
								res.status(201).send(rspUser);
								return;
							} else {
								res.status(404).send("Not found");
								return;
							}
						}).catch(function(error) {
							console.log('Error :::', error);
							res.status(500).send("Internal server error");
							return;
						});
					} else {
						res.status(404).send("Not found");
						return;
					}
				}).catch(function(error) {
					console.log('Error :::', error);
					res.status(500).send("Internal server error");
					return;
				});

		}
	}).catch(function(error) {
		res.status(500).send("Internal server error");
		return;
	})
}

export function me(req, res) {
	if (req.user) {
		delete req.user.email_verified_token;
		delete req.user.email_verified_token_generated;
		delete req.user.forgot_password_token;
		delete req.user.forgot_password_token_generated;
		delete req.user.hashed_pwd;
		delete req.user.salt;
		res.status(200).send(req.user);
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