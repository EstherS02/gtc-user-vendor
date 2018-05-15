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
