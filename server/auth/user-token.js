'use strict';

import config from '../config/environment';
import expressJwt from 'express-jwt';
import cryptography from './encrypt-decrypt';
import generateToken from './token';
import {Models} from '../sqldb';
import resourcesModel from '../config/resource.js';
var sendRsp = require('../utils/response').sendRsp;

var validateJwt = expressJwt({
	secret: config.secrets.accessToken
});

var globalValidateJwt = expressJwt({
	secret: config.secrets.globalAccessToken
});

function createToken(req, res, user) {
	Models[resourcesModel['app-clients']].find({
			where: {
				id: req.body.appClientId
			}
		})
		.then(clientObj => {
			if (!clientObj) {
				sendRsp(res, 404, "User Not Found");
				return;
			}
			var client = clientObj['dataValues'];
			var refreshToken = generateToken(user, client, config.secrets.refreshToken);
			var rspTokens = {};
			rspTokens.access_token = generateToken(user, client, config.secrets.accessToken, config.token.expiresInMinutes);
			rspTokens.refresh_token = generateToken(user, client, config.secrets.refreshToken);
			var encryptedRefToken = cryptography.encrypt(refreshToken);

			Models[resourcesModel['users']].update({
					client_id: client.id,
					refresh_token: refreshToken
				}, {
					where: {
						id: user.id
					},
					individualHooks: true
				})
				.then(numAffected => {
					if (numAffected[0] > 0) {
						sendRsp(res, 200, "Success", rspTokens);
						return;
					} else {
						sendRsp(res, 200, "Success", rspTokens);
						return;
					}
				})
				.catch(err => {
					sendRsp(res, 500, "Server Error");
					return;
				});
		})
		.catch(err => {
			sendRsp(res, 500, "Server Error");
			return;
		})
};

exports.createToken = createToken;