/**
 * Module dependencies.
 */
const oauth2orize = require('oauth2orize');
const passport = require('passport');
const _ = require('lodash');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const auth = require('./auth');
const uservalidate = require('../api/users/users.controller')
const config = require('../config/environment');
const status = require('../config/status');

const model = require('../sqldb/model-connect');

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
	model['User'].findOne({
		where: {
			email: email,
			status: status["ACTIVE"]
		}
	}).then(function(user) {
		if (!user) {
			return done(null, false);
		}
		if (!uservalidate.authenticate(password, user)) {
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

		model["UserToken"].findOne({
			where: {
				user_id: user.id,
				client_id: client.id
			}
		}).then(function(token) {
			if (token) {
				return done(null, accessToken, token.refresh_token, {
					expires_in: config.token.expiresInMinutes * 60
				});
			} else {
				var refreshTokenPayload = {
					userId: user.id,
					email: user.email,
					client: client
				};
				var refreshToken = jwt.sign(refreshTokenPayload, config.secrets.refreshToken);

				var token = {
					client_id: client.id,
					user_id: user.id,
					status: status["ACTIVE"],
					refresh_token: refreshToken
				};

				model['UserToken'].update(token, {
					where: {
						user_id: user.id,
						client_id: client.id
					},
					returning: true
				}).then(function(row) {
					if (row > 0) {
						return done(null, accessToken, refreshToken, {
							expires_in: config.token.expiresInMinutes * 60
						});
					} else {
						model['UserToken'].create(token).then(function(row) {
							if (row) {
								return done(null, accessToken, refreshToken, {
									expires_in: config.token.expiresInMinutes * 60
								});
							}
						}).catch(function(error) {
							if (error) {
								return done(error);
							}
						});
					}
				}).catch(function(error) {
					if (error) {
						return done(error);
					}
				});
			}
		}).catch(function(error) {
			if (error) {
				return done(error);
			}
		});
	}).catch(function(error) {
		if (error) {
			return done(error);
		}
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

		model['User'].findById(tokenPayload.userId).then(function(user) {
			if (!user) {
				return done(null, false);
			} else {
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
					client_id: client.id,
					user_id: user.id,
					status: status["ACTIVE"],
					refresh_token: refreshToken
				};

				model['UserToken'].findOne({
					where: {
						user_id: user.id,
						client_id: client.id,
						refresh_token: refreshToken
					}
				}).then(function(token) {
					if (token) {
						return done(null, accessToken, null, {
							expires_in: config.token.expiresInMinutes * 60
						});
					} else {
						model['UserToken'].create(token).then(function(row) {
							if (row) {
								return done(null, accessToken, null, {
									expires_in: config.token.expiresInMinutes * 60
								});
							}
						}).catch(function(err) {
							if (err) {
								return done(err);
							}
						});
					}
				}).catch(function(err) {
					if (err) {
						return done(err);
					}
				});
			}
		}).catch(function(error) {
			if (error) {
				return done(error);
			}
		});
	});
}));

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