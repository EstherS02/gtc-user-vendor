'use strict';

const crypto = require('crypto');
const uuid = require('node-uuid');
const expressValidator = require('express-validator');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const providers = require('../../config/providers');
const status = require('../../config/status');
const roles = require('../../config/roles');

export function create(req, res) {
	var queryObj = {};
	var vendorBodyParams = {};
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

	if (req.body.vendor_name) {
		vendorBodyParams.vendor_name = req.body.vendor_name;
		delete req.body.vendor_name;
	}
	if (req.body.contact_email) {
		vendorBodyParams.contact_email = req.body.contact_email;
		delete req.body.contact_email;
	}
	if (req.body.base_location) {
		vendorBodyParams.base_location = req.body.base_location;
		delete req.body.base_location;
	}
	if (req.body.vendor_cover_pic_url) {
		vendorBodyParams.vendor_cover_pic_url = req.body.vendor_cover_pic_url;
		delete req.body.vendor_cover_pic_url;
	}
	if (req.body.vendor_profile_pic_url) {
		vendorBodyParams.vendor_profile_pic_url = req.body.vendor_profile_pic_url;
		delete req.body.vendor_profile_pic_url;
	}
	if (req.body.facebook_url) {
		vendorBodyParams.facebook_url = req.body.facebook_url;
		delete req.body.facebook_url;
	}
	if (req.body.google_plus_url) {
		vendorBodyParams.google_plus_url = req.body.google_plus_url;
		delete req.body.google_plus_url;
	}
	if (req.body.twitter_url) {
		vendorBodyParams.twitter_url = req.body.twitter_url;
		delete req.body.twitter_url;
	}
	if (req.body.linkedin_url) {
		vendorBodyParams.linkedin_url = req.body.linkedin_url;
		delete req.body.linkedin_url;
	}
	if (req.body.youtube_url) {
		vendorBodyParams.youtube_url = req.body.youtube_url;
		delete req.body.youtube_url;
	}
	if (req.body.instagram_url) {
		vendorBodyParams.instagram_url = req.body.instagram_url;
		delete req.body.instagram_url;
	}
	if (req.body.flickr_url) {
		vendorBodyParams.flickr_url = req.body.flickr_url;
		delete req.body.flickr_url;
	}
	if (req.body.currency_id) {
		vendorBodyParams.currency_id = req.body.currency_id;
		delete req.body.currency_id;
	}
	if (req.body.timezone_id) {
		vendorBodyParams.timezone_id = req.body.timezone_id;
		delete req.body.timezone_id;
	}

	bodyParams['created_on'] = new Date();

	if (req.body.provider == providers["OWN"]) {
		bodyParams["email_verified"] = 0;
		bodyParams['email_verified_token'] = randomCode;
		bodyParams['email_verified_token_generated'] = new Date();
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
			bodyParams["role"] = roles["VENDOR"];
			model['User'].create(bodyParams)
				.then(function(user) {
					if (user) {
						const rspUser = plainTextResponse(user);
						delete rspUser.salt;
						delete rspUser.hashed_pwd;
						delete rspUser.email_verified_token;
						delete rspUser.email_verified_token_generated;
						
						vendorBodyParams.user_id = rspUser.id;
						vendorBodyParams['created_on'] = new Date();

						model['Vendor'].create(vendorBodyParams)
							.then(function(vendor) {
								if (vendor) {
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
							})
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
		console.log('req.user *****', req.user)
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