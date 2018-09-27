'use strict';

const url = require("url");
const request = require('request');
const service = require('../service');
const cryptography = require('../../auth/encrypt-decrypt');
const config = require('../../config/environment');
const generateAccessToken = require('../../auth/token');
const generateRefreshToken = require('../../auth/token');
const providers = require('../../config/providers');
const status = require('../../config/status');
const roles = require('../../config/roles');
const path = require('path');
const model = require('../../sqldb/model-connect');
var OAuth = require('oauth').OAuth;

export function requestTwitter(req, res) {
	var redirect_uri = config.baseUrl + '/api/auth/twitter';
	var oauth = new OAuth(config.twitterLogin.requestTokenUrl, config.twitterLogin.accessTokenUrl, config.twitterLogin.clientId, config.twitterLogin.secretKey, '1.0A', redirect_uri, 'HMAC-SHA1');
	oauth.getOAuthRequestToken(function(error, oAuthToken, oAuthTokenSecret, results) {
		if (!error) {
			res.redirect("https://api.twitter.com/oauth/authenticate?oauth_token=" + oAuthToken);
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
			res.status(401).send("Username and password do not match.");
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
				res.cookie("gtc_access_token", rspTokens.access_token);
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

function getAccessToken(params, accessTokenUrl) {
	return new Promise(function(resolve, reject) {
		request.post(accessTokenUrl, {
			json: true,
			form: params
		}, function(error, response, body) {
			if (!error && response.statusCode == 200) {
				return resolve(body);
			} else {
				return reject(error);
			}
		});
	});
}

function getPeople(accessToken, peopleApiUrl) {
	return new Promise(function(resolve, reject) {
		request.get({
			url: peopleApiUrl,
			headers: {
				Authorization: 'Bearer ' + accessToken
			},
			json: true
		}, function(error, response, body) {
			if (!error && response.statusCode == 200) {
				return resolve(body);
			} else {
				return reject(error);
			}
		});
	});
}

export async function googleLogin(req, res, next) {
	var rspTokens = {};
	var bodyParams = {};
	var dbUser = {};
	var refreshToken, encryptedRefToken;
	var accessTokenUrl = config.googleLogin.accessTokenUrl;
	var peopleApiUrl = config.googleLogin.peopleApiUrl;
	var params = {
		code: req.body.code,
		client_id: req.body.clientId,
		client_secret: config.googleLogin.secretKey,
		redirect_uri: req.body.redirectUri,
		grant_type: 'authorization_code'
	};

	try {
		const token = await getAccessToken(params, accessTokenUrl);
		const profile = await getPeople(token.access_token, peopleApiUrl);
		const existsUser = await service.findOneRow('User', {
			email: profile.email
		});
		const appClient = await service.findOneRow('Appclient', {
			id: config.auth.clientId,
			status: status['ACTIVE']
		});

		if (existsUser) {
			if (existsUser.google_id == null) {
				bodyParams['email_verified'] = 1;
				bodyParams['google_id'] = profile.sub;

				dbUser = await service.updateRecordNew('User', bodyParams, {
					email: existsUser.email,
					status: status['ACTIVE']
				});
				refreshToken = await generateRefreshToken(dbUser, appClient, config.secrets.refreshToken);
				encryptedRefToken = await cryptography.encrypt(refreshToken);
				rspTokens.access_token = await generateAccessToken(dbUser, appClient, config.secrets.accessToken, config.token.expiresInMinutes);
			} else if (existsUser.google_id == profile.sub) {
				dbUser = await service.findOneRow('User', {
					email: existsUser.email,
					google_id: existsUser.google_id,
					status: status['ACTIVE']
				});
				refreshToken = await generateRefreshToken(dbUser, appClient, config.secrets.refreshToken);
				encryptedRefToken = await cryptography.encrypt(refreshToken);
				rspTokens.access_token = await generateAccessToken(dbUser, appClient, config.secrets.accessToken, config.token.expiresInMinutes);
			} else {
				return res.status(400).send("Failed to login with your google account...");
			}
		} else {
			bodyParams['email_verified'] = 1;
			bodyParams['role'] = roles['USER'];
			bodyParams['email'] = profile.email;
			bodyParams['contact_email'] = profile.contact_email;
			bodyParams['created_on'] = new Date();
			bodyParams["status"] = status["ACTIVE"];
			bodyParams['provider'] = providers["GOOGLE"];
			bodyParams['first_name'] = profile.given_name;
			bodyParams['last_name'] = profile.family_name;
			bodyParams['user_pic_url'] = profile.picture;
			bodyParams['google_id'] = profile.sub;

			dbUser = await service.createRow('User', bodyParams);

			refreshToken = await generateRefreshToken(dbUser, appClient, config.secrets.refreshToken);
			encryptedRefToken = await cryptography.encrypt(refreshToken);
			rspTokens.access_token = await generateAccessToken(dbUser, appClient, config.secrets.accessToken, config.token.expiresInMinutes);
		}

		var userToken = {
			client_id: appClient.id,
			refresh_token: refreshToken,
			status: status["ACTIVE"],
			user_id: dbUser.id
		};

		const newToken = await service.upsertRecord('UserToken', userToken, {
			user_id: dbUser.id,
			client_id: appClient.id
		});
		res.cookie("gtc_refresh_token", encryptedRefToken);
		res.cookie("gtc_access_token", rspTokens.access_token);
		return res.status(200).json({
			'status': 200,
			'message': 'ok',
			'messageDetails': 'successful'
		});
	} catch (error) {
		console.log("googleLoginNew Error:::", error);
		return res.status(500).send(error);
	}
}

export async function facebook(req, res) {
	var rspTokens = {};
	var bodyParams = {};
	var dbUser = {};
	var refreshToken, encryptedRefToken;
	var fields = config.facebookLogin.fields;
	const accessTokenUrl = config.facebookLogin.accessTokenUrl;
	const peopleApiUrl = config.facebookLogin.peopleApiUrl + fields.join(',');
	var params = {
		code: req.query.code,
		client_id: config.facebookLogin.clientId,
		client_secret: config.facebookLogin.secretKey,
		redirect_uri: config.secureBaseURL + '/api/auth/facebook',
		grant_type: 'authorization_code'
	};

	try {
		if (req.query.error == 'access_denied') {
			return res.render('window-popup-close', {
				layout: false,
				popupResponseData: null
			});
		} else {
			const token = await getAccessToken(params, accessTokenUrl);
			const profile = await getPeople(token.access_token, peopleApiUrl);
			if (!profile.email) {
				profile['email'] = profile.id + '@facebook.com';
				bodyParams['contact_email'] = null;
			}else{
				bodyParams['contact_email'] = profile.email;
			}
			const existsUser = await service.findOneRow('User', {
				email: profile.email
			});
			const appClient = await service.findOneRow('Appclient', {
				id: config.auth.clientId,
				status: status['ACTIVE']
			});
			if (existsUser) {
				if (existsUser.fb_id == null) {
					bodyParams['email_verified'] = 1;
					bodyParams['fb_id'] = profile.id;

					dbUser = await service.updateRecordNew('User', bodyParams, {
						email: existsUser.email,
						status: status['ACTIVE']
					});
					refreshToken = await generateRefreshToken(dbUser, appClient, config.secrets.refreshToken);
					encryptedRefToken = await cryptography.encrypt(refreshToken);
					rspTokens.access_token = await generateAccessToken(dbUser, appClient, config.secrets.accessToken, config.token.expiresInMinutes);
				} else if (existsUser.fb_id == profile.id) {
					dbUser = await service.findOneRow('User', {
						email: existsUser.email,
						fb_id: existsUser.fb_id,
						status: status['ACTIVE']
					});
					refreshToken = await generateRefreshToken(dbUser, appClient, config.secrets.refreshToken);
					encryptedRefToken = await cryptography.encrypt(refreshToken);
					rspTokens.access_token = await generateAccessToken(dbUser, appClient, config.secrets.accessToken, config.token.expiresInMinutes);
				} else {
					return res.status(400).send("Failed to login with your google account...");
				}
			} else {
				bodyParams['email_verified'] = 1;
				bodyParams['role'] = roles['USER'];
				bodyParams['email'] = profile.email;
				bodyParams['created_on'] = new Date();
				bodyParams["status"] = status["ACTIVE"];
				bodyParams['provider'] = providers["FB"];
				bodyParams['first_name'] = profile.first_name;
				bodyParams['last_name'] = profile.last_name;
				bodyParams['user_pic_url'] = "https://graph.facebook.com/" + profile.id + "/picture?type=large";
				bodyParams['fb_id'] = profile.id;

				dbUser = await service.createRow('User', bodyParams);

				refreshToken = await generateRefreshToken(dbUser, appClient, config.secrets.refreshToken);
				encryptedRefToken = await cryptography.encrypt(refreshToken);
				rspTokens.access_token = await generateAccessToken(dbUser, appClient, config.secrets.accessToken, config.token.expiresInMinutes);
			}

			var userToken = {
				client_id: appClient.id,
				refresh_token: refreshToken,
				status: status["ACTIVE"],
				user_id: dbUser.id
			};

			const newToken = await service.upsertRecord('UserToken', userToken, {
				user_id: dbUser.id,
				client_id: appClient.id
			});
			res.cookie("gtc_refresh_token", encryptedRefToken);
			res.cookie("gtc_access_token", rspTokens.access_token);
			return res.render('window-popup-close', {
				layout: false,
				popupResponseData: "successful"
			});
		}
	} catch (error) {
		console.log("facebook Error:::", error);
		return res.render('window-popup-close', {
			layout: false,
			popupResponseData: error
		});
	}
}

export async function linkedin(req, res) {
	var rspTokens = {};
	var bodyParams = {};
	var dbUser = {};
	var refreshToken, encryptedRefToken;
	const accessTokenUrl = config.linkedInLogin.accessTokenUrl;
	const peopleApiUrl = config.linkedInLogin.peopleApiUrl;
	var params = {
		code: req.query.code,
		client_id: config.linkedInLogin.clientId,
		client_secret: config.linkedInLogin.secretKey,
		redirect_uri: config.baseUrl + '/api/auth/linkedin',
		grant_type: 'authorization_code'
	};

	try {
		if (req.query.error == 'user_cancelled_authorize') {
			return res.render('window-popup-close', {
				layout: false,
				popupResponseData: null
			});
		} else {
			const token = await getAccessToken(params, accessTokenUrl);
			const profile = await getPeople(token.access_token, peopleApiUrl);
			if (!profile.emailAddress) {
				profile['emailAddress'] = profile.id + '@linkedin.com';
				bodyParams['contact_email'] = null;
			}else{
				bodyParams['contact_email'] = profile.emailAddress;
			}
			const existsUser = await service.findOneRow('User', {
				email: profile.emailAddress
			});
			const appClient = await service.findOneRow('Appclient', {
				id: config.auth.clientId,
				status: status['ACTIVE']
			});
			if (existsUser) {
				if (existsUser.linkedin_id == null) {
					bodyParams['email_verified'] = 1;
					bodyParams['linkedin_id'] = profile.id;

					dbUser = await service.updateRecordNew('User', bodyParams, {
						email: existsUser.email,
						status: status['ACTIVE']
					});
					refreshToken = await generateRefreshToken(dbUser, appClient, config.secrets.refreshToken);
					encryptedRefToken = await cryptography.encrypt(refreshToken);
					rspTokens.access_token = await generateAccessToken(dbUser, appClient, config.secrets.accessToken, config.token.expiresInMinutes);
				} else if (existsUser.linkedin_id == profile.id) {
					dbUser = await service.findOneRow('User', {
						email: existsUser.email,
						linkedin_id: existsUser.linkedin_id,
						status: status['ACTIVE']
					});
					refreshToken = await generateRefreshToken(dbUser, appClient, config.secrets.refreshToken);
					encryptedRefToken = await cryptography.encrypt(refreshToken);
					rspTokens.access_token = await generateAccessToken(dbUser, appClient, config.secrets.accessToken, config.token.expiresInMinutes);
				} else {
					return res.status(400).send("Failed to login with your google account...");
				}
			} else {
				bodyParams['email_verified'] = 1;
				bodyParams['role'] = roles['USER'];
				bodyParams['email'] = profile.emailAddress;
				bodyParams['created_on'] = new Date();
				bodyParams["status"] = status["ACTIVE"];
				bodyParams['provider'] = providers["LINKEDIN"];
				bodyParams['first_name'] = profile.firstName;
				bodyParams['last_name'] = profile.lastName;
				bodyParams['user_pic_url'] = profile.pictureUrl;
				bodyParams['linkedin_id'] = profile.id;

				dbUser = await service.createRow('User', bodyParams);

				refreshToken = await generateRefreshToken(dbUser, appClient, config.secrets.refreshToken);
				encryptedRefToken = await cryptography.encrypt(refreshToken);
				rspTokens.access_token = await generateAccessToken(dbUser, appClient, config.secrets.accessToken, config.token.expiresInMinutes);
			}

			var userToken = {
				client_id: appClient.id,
				refresh_token: refreshToken,
				status: status["ACTIVE"],
				user_id: dbUser.id
			};

			const newToken = await service.upsertRecord('UserToken', userToken, {
				user_id: dbUser.id,
				client_id: appClient.id
			});
			res.cookie("gtc_refresh_token", encryptedRefToken);
			res.cookie("gtc_access_token", rspTokens.access_token);
			return res.render('window-popup-close', {
				layout: false,
				popupResponseData: "successful"
			});
		}
	} catch (error) {
		console.log("linkedIN Error:::", error);
		return res.render('window-popup-close', {
			layout: false,
			popupResponseData: error
		});
	}
}

export async function twitter(req, res) {
	var dbUser = {};
	var rspTokens = {};
	var bodyParams = {};
	var refreshToken, encryptedRefToken;
	var redirect_uri = config.baseUrl + '/api/auth/twitter';
	var oauth = new OAuth(config.twitterLogin.requestTokenUrl, config.twitterLogin.accessTokenUrl, config.twitterLogin.clientId, config.twitterLogin.secretKey, '1.0A', redirect_uri, 'HMAC-SHA1');
	oauth.getOAuthAccessToken(req.query.oauth_token, config.twitterLogin.secretKey, req.query.oauth_verifier, async function(error, oauth_access_token, oauth_access_token_secret, results) {
		if (error === null) {
			oauth.get('https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true',
				oauth_access_token,
				oauth_access_token_secret,
				async function(error, twitterResponseData, result) {
					if (error == null) {
						const profile = JSON.parse(twitterResponseData);
						if (!profile.email) {
							profile['email'] = profile.id + '@twitter.com';
							bodyParams['contact_email'] = null;
						}else{
							bodyParams['contact_email'] = profile.email;
						}
						const existsUser = await service.findOneRow('User', {
							email: profile.email
						});
						const appClient = await service.findOneRow('Appclient', {
							id: config.auth.clientId,
							status: status['ACTIVE']
						});
						if (existsUser) {
							if (existsUser.twitter_id == null) {
								bodyParams['email_verified'] = 1;
								bodyParams['twitter_id'] = profile.id;

								dbUser = await service.updateRecordNew('User', bodyParams, {
									email: existsUser.email,
									status: status['ACTIVE']
								});
								refreshToken = await generateRefreshToken(dbUser, appClient, config.secrets.refreshToken);
								encryptedRefToken = await cryptography.encrypt(refreshToken);
								rspTokens.access_token = await generateAccessToken(dbUser, appClient, config.secrets.accessToken, config.token.expiresInMinutes);
							} else if (existsUser.twitter_id == profile.id) {
								dbUser = await service.findOneRow('User', {
									email: existsUser.email,
									twitter_id: existsUser.twitter_id,
									status: status['ACTIVE']
								});
								refreshToken = await generateRefreshToken(dbUser, appClient, config.secrets.refreshToken);
								encryptedRefToken = await cryptography.encrypt(refreshToken);
								rspTokens.access_token = await generateAccessToken(dbUser, appClient, config.secrets.accessToken, config.token.expiresInMinutes);
							} else {
								return res.status(400).send("Failed to login with your google account...");
							}
						} else {
							bodyParams['email_verified'] = 1;
							bodyParams['role'] = roles['USER'];
							bodyParams['email'] = profile.email;
							bodyParams['created_on'] = new Date();
							bodyParams["status"] = status["ACTIVE"];
							bodyParams['provider'] = providers["TWITTER"];
							bodyParams['first_name'] = profile.name;
							bodyParams['user_pic_url'] = profile.profile_image_url_https;
							bodyParams['twitter_id'] = profile.id;

							dbUser = await service.createRow('User', bodyParams);

							refreshToken = await generateRefreshToken(dbUser, appClient, config.secrets.refreshToken);
							encryptedRefToken = await cryptography.encrypt(refreshToken);
							rspTokens.access_token = await generateAccessToken(dbUser, appClient, config.secrets.accessToken, config.token.expiresInMinutes);
						}

						var userToken = {
							client_id: appClient.id,
							refresh_token: refreshToken,
							status: status["ACTIVE"],
							user_id: dbUser.id
						};

						const newToken = await service.upsertRecord('UserToken', userToken, {
							user_id: dbUser.id,
							client_id: appClient.id
						});
						res.cookie("gtc_refresh_token", encryptedRefToken);
						res.cookie("gtc_access_token", rspTokens.access_token);
						return res.render('window-popup-close', {
							layout: false,
							popupResponseData: "successful"
						});
					} else {
						return res.status(error.statusCode).json(error);
					}
				});
		} else {
			return res.status(error.statusCode).json(error);
		}
	});
}

export function logout(req, res, next) {
	var refreshToken = cryptography.decrypt(req.cookies.gtc_refresh_token);
	res.clearCookie('gtc_refresh_token');
	res.clearCookie('gtc_access_token');
	model['UserToken'].destroy({
		where: {
			user_id: req.user.id,
			refresh_token: refreshToken
		},
		returning: true
	}).then(function(row) {
		if (row > 0)
			return res.status(200).send("Logout successfully");
		else
			return res.status(200).send("Already Logged Out");
	}).catch(function(error) {
		if (error) {
			res.status(500).send("Internal server error");
			return;
		}
	});
}