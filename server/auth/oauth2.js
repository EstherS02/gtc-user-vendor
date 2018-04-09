/**
 * Module dependencies.
 */
import oauth2orize from 'oauth2orize';
import passport from 'passport';
import crypto from 'crypto';
import config from '../config/environment';
import jwt from 'jsonwebtoken';
import auth from './auth';
import _ from 'lodash';
import {
	Models
} from '../sqldb';
import resourcesModel from '../config/resource.js';
var log = require('../libs/log')(module);

// create OAuth 2.0 server
var server = oauth2orize.createServer();

/**
 * Exchange user id and password for access tokens.
 * 
 * The callback accepts the `client`, which is exchanging the user's name and
 * password from the token request for verification. If these values are
 * validated, the application issues an access token on behalf of the user who
 * authorized the code.
 */
server.exchange(oauth2orize.exchange.password(function(client, email, password,
	scope, done) {
	Models[resourcesModel['users']].find({
			where: {
				email: email
			}
		})
		.then(userObj => {
			if (!userObj) {
				return done(null, false);
			}

			var user = userObj['dataValues'];
			if (!userAuthenticate(password, user)) {
				return done(null, false);
			}

			var tokenPayload = {
				userId: user.id,
				email: user.email,
				client: client
			};

			var accessToken = jwt.sign(tokenPayload, config.secrets.accessToken, {
				expiresIn: config.token.expiresInMinutes * 60
			});

			if (user.client_id && user.refresh_token) {
				if (user.client_id.toString() === client.id.toString()) {
					return done(null, accessToken, user.refresh_token, {
						expires_in: config.token.expiresInMinutes * 60
					});
				}
			}

			var refreshTokenPayload = {
				userId: user.id,
				email: user.email,
				client: client
			};
			var refreshToken = jwt.sign(refreshTokenPayload, config.secrets.refreshToken);

			Models[resourcesModel['users']].update({
					refresh_token: refreshToken
				}, {
					where: {
						id: user.id,
						client_id: client.id
					},
					individualHooks: true
				})
				.then(numAffected => {
					if (numAffected[0] == 0) {
						Models[resourcesModel['users']].update({
								refresh_token: refreshToken,
								client_id: client.id
							}, {
								where: {
									id: user.id
								},
								individualHooks: true
							})
							.then(data => {
								if (data[0] > 0) {
									return done(null, accessToken, refreshToken, {
											expires_in: config.token.expiresInMinutes * 60
										});
								} else {
									return done(null, accessToken, refreshToken, {
											expires_in: config.token.expiresInMinutes * 60
										});
								}
							})
							.catch(err => {
								return done(null, false);
							});
					} else {
						return done(null, accessToken, refreshToken, {
							expires_in: config.token.expiresInMinutes * 60
						});
					}
				})
				.catch(err => {
					return done(null, false);
				});
		})
		.catch(err => {
			return done(err);
		});
}));

/**
 * Exchange the refresh token for an access token.
 * 
 * The callback accepts the `client`, which is exchanging the client's id from
 * the token request for verification. If this value is validated, the
 * application issues an access token on behalf of the client who authorized the
 * code
 */
server.exchange(oauth2orize.exchange.refreshToken(function(client,
	refreshToken, scope, done) {
	jwt.verify(refreshToken, config.secrets.refreshToken, function(err,
		tokenPayload) {
		if (err) {
			return done(err);
		}
		if (client.id != tokenPayload.client.id) {
			return done(null, false);
		}
		if (client.secret != tokenPayload.client.secret) {
			return done(null, false);
		}
		Models[resourcesModel['users']].find({
				where: {
					id: tokenPayload.userId
				}
			})
			.then(userObj => {

				if (!userObj) {
					return done(null, false);
				}

				var user = userObj['dataValues'];
				var newTokenPayload = {
					userId: user.id,
					email: user.email,
					client: client
				};
				var accessToken = jwt.sign(newTokenPayload,
					config.secrets.accessToken, {
						expiresIn: config.token.expiresInMinutes * 60
					});

				var token = {
					clientId: client.id,
					accessToken: accessToken,
					refreshToken: refreshToken
				};

				Models[resourcesModel['users']].update({
						client_id: client.id,
						refresh_token: refreshToken
					}, {
						where: {
							id: user.id,
							client_id: client.id
						}
					})
					.then(numAffected => {
						if (numAffected[0] == 0) {

							Models[resourcesModel['users']].update({
									client_id: client.id,
									refresh_token: refreshToken
								}, {
									where: {
										id: user.id
									}
								})
								.then(numAffected => {
									return done(null, accessToken, null, {
										expires_in: config.token.expiresInMinutes * 60
									});
								})
								.catch(err => {
									console.log(err);
									return done(null, false);
								});
						}
						return done(null, accessToken, null, {
							expires_in: config.token.expiresInMinutes * 60
						});
					})
					.catch(err => {
						console.log(err);
						return done(null, false);
					});
			})
			.catch(err => {
				return done(err);
			});
	});
}));


//user authentication process
function userAuthenticate(password, user) {
	return encryptPassword(password, user) === user.hashed_password;
};

function encryptPassword(password, user) {
	if (!password || !user.salt)
		return '';
	var saltWithEmail = new Buffer(user.salt + user.email.toString('base64'), 'base64');
	return crypto.pbkdf2Sync(password, saltWithEmail, 10000, 64, 'sha1').toString('base64');
}

/**
 * Token endpoint
 * 
 * `token` middleware handles client requests to exchange authorization grants
 * for access tokens. Based on the grant type being exchanged, the above
 * exchange middleware will be invoked to handle the request. Clients must
 * authenticate when making requests to this endpoint.
 */
exports.token = [
	passport.authenticate(['basic', 'oauth2-client-password'], {
		session: false
	}), server.token(), server.errorHandler()
];