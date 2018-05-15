'use strict';

const url = require("url");
const request = require('request');
const cryptography = require('../../auth/encrypt-decrypt');
const config = require('../../config/environment');
const path = require('path');
const model = require('../../sqldb/model-connect');

var OAuth = require('oauth').OAuth;
var twitterKey = "sh0eBtn7CpLlsahv5eY1pkmOy";
var twitterSecret = "nHrHjijDcgwVX547BwZclOgwfETJKcQzsfiAg63Jj6hMKWejcV";

var oauth = new OAuth(
	'https://api.twitter.com/oauth/request_token',
	'https://api.twitter.com/oauth/access_token',
	twitterKey,
	twitterSecret,
	'1.0A',
	'http://localhost:9000/api/auth/twitter/callback',
	'HMAC-SHA1'
);


export function twitterAuth(req, res) {

	oauth.getOAuthRequestToken(function (error, oAuthToken, oAuthTokenSecret, results) {

		if (error === null && results && results.oauth_callback_confirmed) {

			res.redirect("https://api.twitter.com/oauth/authenticate?oauth_token=" + oAuthToken);
		} else {

			res.status(error.statusCode).json(error);
		}

	});

}


export function twitterCallbackAuth(req, res) {

	oauth.getOAuthAccessToken(req.query.oauth_token, oauth.token_secret, req.query.oauth_verifier,
		function (error, oauth_access_token, oauth_access_token_secret, results) {
			if (error === null) {

				console.log(oauth_access_token, oauth_access_token_secret, results);

				oauth.get('https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true',
					oauth_access_token,
					oauth_access_token_secret, function (error, twitterResponseData, result) {
						if (error === null) {
							console.log(JSON.parse(twitterResponseData));
							console.log(typeof JSON.parse(twitterResponseData))

							var responseData = JSON.parse(twitterResponseData);
							
							res.render('twitterCallbackClose', {
								layout: false,
								twitterResponseData: encodeURIComponent(twitterResponseData)
							});

							//res.status(200).json(JSON.parse(twitterResponseData));
						} else {
							res.status(error.statusCode).json(error);
						}
					});

			} else {
				res.status(error.statusCode).json(error);
			}
		});

}

export function login(req, res) {
	var params = {};
	params.username = req.body.email;
	params.password = req.body.password;
	params.grant_type = "password";
	var clientId = config.auth.clientId;
	var clientSecret = config.auth.clientSecret;
	var authCode = new Buffer(clientId + ":" + clientSecret).toString('base64');
	request.post({
		url: config.auth.url,
		form: params,
		headers: {
			"Authorization": "Basic " + authCode
		}
	}, function(err, response, body) {
		if (response.statusCode != 200) {
			res.status(401).send("Invalid login");
			return;
		}
		var email = req.body.email;
		var tokens = {};
		var rspTokens = {};
		var tokenJSON = JSON.parse(body);
		var refreshToken = tokenJSON.refresh_token;
		rspTokens.access_token = tokenJSON.access_token;
		rspTokens.expires_in = tokenJSON.expires_in;
		rspTokens.token_type = tokenJSON.token_type;
		rspTokens.refresh_token = tokenJSON.refresh_token;
		var encryptedRefToken = cryptography.encrypt(refreshToken);
		tokens.clientId = clientId;
		tokens.refreshToken = JSON.parse(body).refresh_token;

		model['User'].findOne({
			where: {
				email: email
			}
		}).then(function(user) {
			if (user) {
				res.cookie("gtc_refresh_token", encryptedRefToken);
				res.status(200).send(rspTokens);
				return;
			} else {
				res.status(404).send("User not found");
				return;
			}
		}).catch(function(err) {
			if (err) {
				res.status(500).send("Internal server error");
				return;
			}
		});
	});
}

exports.refreshToken = function(req, res, next) {
	var decryptedRefToken = cryptography.decrypt(req.cookies.gtc_refresh_token);
	model['User'].findOne({
		where: {
			email: req.body.email
		}
	}).then(function(user) {
		if (user) {
			model['UserToken'].findOne({
				where: {
					user_id: user.id
				}
			}).then(function(token) {
				if (token) {
					var flag = false;
					if (token.refresh_token == decryptedRefToken) {
						flag = true;
					}
					if (!flag) {
						res.status(403).send("Token mismatched");
						return;
					}
					var params = {};
					var clientId = config.auth.clientId;
					var clientSecret = config.auth.clientSecret;
					params.refresh_token = decryptedRefToken;
					params.grant_type = "refresh_token";

					var authCode = new Buffer(clientId + ":" + clientSecret).toString('base64');
					request.post({
						url: config.auth.url,
						form: params,
						headers: {
							"Authorization": "Basic " + authCode
						}
					}, function(err, response, body) {
						res.status(200).send(JSON.parse(body))
					});
				} else {
					res.status(404).send("User token not found");
					return;
				}
			}).catch(function(error) {
				if (error) {
					res.status(500).send("Internal server error");
					return;
				}
			});
		} else {
			res.clearCookie('gtc_refresh_token');
			res.status(404).send("User not found");
			return
		}
	}).catch(function(error) {
		if (error) {
			res.status(500).send("Internal server error");
			return;
		}
	});
}

export function logout(req, res, next) {
	var refreshToken = cryptography.decrypt(req.cookies.gtc_refresh_token);
	res.clearCookie('gtc_refresh_token');
	model['UserToken'].destroy({
		where: {
			user_id: req.user.id,
			refresh_token: refreshToken
		},
		returning: true
	}).then(function(row) {
		if (row > 0) {
			res.status(200).send("Logout successfully");
			return;
		}
	}).catch(function(error) {
		if (error) {
			res.status(500).send("Internal server error");
			return;
		}
	});
}