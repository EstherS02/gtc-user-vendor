'use strict';

const crypto = require('crypto');
const uuid = require('node-uuid');
const sequelize = require('sequelize');
const expressValidator = require('express-validator');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const providers = require('../../config/providers');
const status = require('../../config/status');
const roles = require('../../config/roles');

export function index(req, res) {
	var offset, limit, field, order;
	var queryObj = {};

	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;
	delete req.query.limit;
	field = req.query.field ? req.query.field : "id";
	delete req.query.field;
	order = req.query.order ? req.query.order : "asc";
	delete req.query.order;

	queryObj = req.query;
	queryObj.role = roles['USER'];

	model['User'].findAndCountAll({
		where: queryObj,
		offset: offset,
		limit: limit,
		attributes: {
			exclude: ['hashed_pwd', 'salt', 'email_verified_token', 'email_verified_token_generated', 'forgot_password_token', 'forgot_password_token_generated']
		},
		order: [
			[field, order]
		],
		raw: true
	}).then(function(rows) {
		if (rows.length > 0) {
			res.status(200).send(rows);
			return;
		} else {
			res.status(200).send(rows);
			return;
		}
	}).catch(function(error) {
		console.log('Error :::', error);
		res.status(500).send("Internal server error");
		return
	})
}

export function create(req, res) {
	var queryObj = {};
	var randomCode = uuid.v1();

	req.checkBody('first_name', 'Missing Query Param').notEmpty();
	req.checkBody('provider', 'Missing Query Param').notEmpty();

	if (req.body.provider == providers["OWN"]) {
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

	if (req.body.provider == providers["OWN"]) {
		bodyParams["email_verified"] = 0;
		bodyParams['email_verified_token'] = randomCode;
		bodyParams['email_verified_token_generated'] = Date.now();
	}

	if (req.body.email) {
		queryObj['email'] = req.body.email;
	}

	model['User'].findOne({
		where: queryObj
	}).then(function(user) {
		if (user) {
			res.status(409).send("Email address already exists");
			return;
		} else {
			bodyParams["status"] = status["ACTIVE"];
			bodyParams["role"] = roles["USER"];

			model['User'].create(bodyParams)
				.then(function(row) {
					if (row) {
						const rspUser = plainTextResponse(row);
						delete rspUser.salt;
						delete rspUser.hashed_pwd;
						delete rspUser.email_verified_token;
						delete rspUser.email_verified_token_generated;
						res.status(201).send(rspUser);
						return;
					}
				})
				.catch(function(error) {
					console.log('Error :::', error);
					res.status(500).send("Internal server error");
					return;
				});
		}
	}).catch(function(error) {
		console.log('Error :::', error);
		res.status(500).send("Internal server error");
		return
	});
}

export function me(req, res) {
	if (req.user) {
		res.status(200).send(req.user);
		return;
	}
}

export function destroy(req, res) {
	const ids = req.params.ids.split(' ').map(Number);
	model['User'].destroy({
		where: {
			id: ids
		}
	}).then(function(row) {
		if (row > 0) {
			res.status(200).send("Users deleted successfully");
			return;
		} else {
			res.status(404).send("Cannot delete users");
			return
		}
	}).catch(function(error) {
		console.log('Error :::', error);
		res.status(500).send("Internal server error");
		return
	})
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