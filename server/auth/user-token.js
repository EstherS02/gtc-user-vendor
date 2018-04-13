'use strict';

import passport from 'passport';
import expressJwt from 'express-jwt';
import compose from 'composable-middleware';
import cryptography from './encrypt-decrypt';
import config from '../config/environment';
import generateToken from './token';

import models from '../../models/index';

const model = models.init(sequelizeDB);

var validateJwt = expressJwt({
	secret: config.secrets.accessToken
});
var globalValidateJwt = expressJwt({
	secret: config.secrets.globalAccessToken
});

function createToken(req, res, user) {
	model['Appclient'].findById(req.body.appClientId).then(function(client) {
			var refreshToken = generateToken(user, client, config.secrets.refreshToken);
			var rspTokens = {};
			rspTokens.access_token = generateToken(user, client, config.secrets.accessToken, config.token.expiresInMinutes);
			rspTokens.refresh_token = generateToken(user, client, config.secrets.refreshToken);
			var encryptedRefToken = cryptography.encrypt(refreshToken);
			var token = {
				clientId: client._id,
				refreshToken: refreshToken
			};
			model['User'].update(token, {
					where: {
						id: user.id
					}
				}).then(function(row) {
					res.send(200, rspTokens)
					return;
				})
				.catch(function(error) {
					console.log('error', error);
					return;
				});
		})
		.catch(function(err) {
			console.log('err', err);
			return;
		});
};

exports.createToken = createToken;