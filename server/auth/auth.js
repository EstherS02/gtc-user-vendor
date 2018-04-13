'use strict';

const passport = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;
const ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
const model = require('../sqldb/model-connect');

/**
 * BasicStrategy & ClientPasswordStrategy
 * 
 * These strategies are used to authenticate registered OAuth clients. They are
 * employed to protect the `token` endpoint, which consumers use to obtain
 * access tokens. The OAuth 2.0 specification suggests that clients use the HTTP
 * Basic scheme to authenticate. Use of the client password strategy allows
 * clients to send the same credentials in the request body (as opposed to the
 * `Authorization` header). While this approach is not recommended by the
 * specification, in practice it is quite common.
 */
passport.use(new BasicStrategy(function(clientId, clientSecret, done) {
	model['Appclient'].findById(clientId).then(function(client) {
			if (!client) {
				return done(null, false);
			}
			if (client.secret != clientSecret) {
				return done(null, false);
			}
			return done(null, client);
		})
		.catch(function(err) {
			if (err) {
				return done(err);
			}
		});
}));

/**
 * Client Password strategy
 * 
 * The OAuth 2.0 client password authentication strategy authenticates clients
 * using a client ID and client secret. The strategy requires a verify callback,
 * which accepts those credentials and calls done providing a client.
 */
passport.use(new ClientPasswordStrategy(function(clientId, clientSecret, done) {
	model['Appclient'].findById(clientId).then(function(client) {
			if (!client) {
				return done(null, false);
			}
			if (client.secret != clientSecret) {
				return done(null, false);
			}
			return done(null, client);
		})
		.catch(function(err) {
			if (err) {
				return done(err);
			}
		});
}));