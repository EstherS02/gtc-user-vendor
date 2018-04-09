'use strict';

import config from '../../config/environment';
import request from 'request';
import {
	Models
} from '../../sqldb';
import endPointModel from '../../config/end_point.js';
//import cryptography from '../../auth/encrypt-decrypt';
//import generateToken from '../../auth/token';
//import AWS from 'aws-sdk';
//import crypto from 'crypto';
//var random = require("random-js")();
var sendRsp = require('../../utils/response').sendRsp;
//var log = require('../../libs/log')(module);

exports.login = function(req, res, next) {

	console.log("login.....");

	var params = {};
	params.username = req.body.email;
	params.password = req.body.password;
	params.grant_type = "password";
	//var clientId = config.auth.clientId;
	//var clientSecret = config.auth.clientSecret;
	//var authCode = new Buffer(clientId + ":" + clientSecret).toString('base64');
	request.post(/*{
		url: config.auth.url,
		form: params,
		headers: {
			"Authorization": "Basic " + authCode
		}
	},*/ function(err, response, body) {
		if (response.statusCode != 200) {
			sendRsp(res, 401, 'Invalid email or Password');
			return;
		}
		var email = req.body.email;
		var rspTokens = {};
		var tokenJSON = JSON.parse(body);
		var refreshToken = tokenJSON.refresh_token;
		rspTokens.access_token = tokenJSON.access_token;
		rspTokens.expires_in = tokenJSON.expires_in;
		rspTokens.token_type = tokenJSON.token_type;
		rspTokens.refresh_token = tokenJSON.refresh_token;
		var encryptedRefToken = cryptography.encrypt(refreshToken);
		Models[resourcesModel['users']].find({
				where: {
					email: email
				}
			})
			.then(userObj => {
				if (!userObj) {
					sendRsp(res, 404, 'User Not Found');
					return
				}
				var user = userObj.dataValues;
				res.cookie("education_portal_refresh_token", encryptedRefToken);
				sendRsp(res, 200, 'Success', rspTokens);
				return;
			})
			.catch(err => {
				sendRsp(res, 500, "Server Error");
				return;
			});
	});
}

exports.refreshToken = function(req, res, next) {
	/*var decryptedRefToken = cryptography.decrypt(req.cookies.education_portal_refresh_token);
	Models[resourcesModel['users']].find({
			where: {
				email: req.body.email
			}
		})
		.then(userObj => {
			if (!userObj) {
				res.clearCookie('education_portal_refresh_token');
				sendRsp(res, 404, "User Not Found");
				return;
			}
			var user = userObj.dataValues;
			var token = user.refresh_token;
			var flag = false;

			if (token === decryptedRefToken) {
				flag = true
			}

			if (!flag) {
				sendRsp(res, 403, "Refesh Token Mismatched");
				return;
			}

			var params = {};
			params.refresh_token = decryptedRefToken;
			var clientId = config.auth.clientId;
			var clientSecret = config.auth.clientSecret;
			params.grant_type = "refresh_token";
			var authCode = new Buffer(clientId + ":" + clientSecret).toString('base64');
			request.post({
				url: config.auth.url,
				form: params,
				headers: {
					"Authorization": "Basic " + authCode
				}
			}, function(err, response, body) {
				sendRsp(res, 200, "Success", JSON.parse(body));
			});
		})
		.catch(err => {
			sendRsp(res, 500, 'Server Error');
			return;
		})*/
}

exports.logout = function(req, res, next) {
	/*var refToken = cryptography.decrypt(req.cookies.education_portal_refresh_token);
	res.clearCookie('education_portal_refresh_token');
	Models[resourcesModel['users']].update({
			refresh_token: null,
			client_id: null
		}, {
			where: {
				id: req.user.id
			},
			individualHooks: true
		})
		.then(result => {
			if (result[0] > 0) {
				sendRsp(res, 200, "Logout Successfully");
				return;
			} else {
				sendRSp(res, 500, "Server Error");
				return;
			}
		})
		.catch(err => {
			log.error('Internal error(%d): %s', res.statusCode, err.message);
			sendRsp(res, 500, "Server Error");
			return;
		})
}

exports.sendOtpMobile = function(req, res) {
	var user = req.user;

	var otp = random.integer(100000, 999999);

	var msg = "Dear Customer. Thank you for registering with WokkitPro. Your OTP is " + otp;

	var params = {};
	params.authkey = config.msg91.authKey;
	params.sender = config.msg91.senderId;
	params.route = 'default';
	params.otp = otp;
	params.message = msg;
	params.mobiles = user.phone;

	request.post({
		url: config.msg91.apiUrl,
		form: params,
		headers: {}
	}, function(err, response, body) {
		if (!err && response.statusCode == 200) {
			Models[resourcesModel['users']].update({
					otp: otp,
					otp_sent_at: new Date()
				}, {
					where: {
						email: user.email
					},
					individualHooks: true
				})
				.then(result => {
					if (result[0] > 0) {
						sendRsp(res, 200, "Otp Send Successfully");
						return;
					} else {
						sendRSp(res, 500, "Server Error");
						return;
					}
				})
				.catch(err => {
					log.error('Internal error(%d): %s', res.statusCode, err.message);
					sendRsp(res, 500, "Server Error");
					return;
				})
		} else {
			sendRsp(res, 500, 'Internal Server Error');
			return;
		}
	});*/
}