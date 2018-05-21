'use strict';

import jwt from 'jsonwebtoken';

function generateAccessToken(user, client, secret, expiresIn) {
	var tokenPayload = {
		userId: user.id,
		email: user.email,
		client: client
	};
	var token = jwt.sign(tokenPayload, secret, {
		expiresIn: expiresIn * 60
	});
	return token;
}

function generateRefreshToken(user, client, secret) {
	var refreshTokenPayload = {
		userId: user.id,
		email: user.email,
		client: client
	};
	var token = jwt.sign(refreshTokenPayload, secret);
	return token;
}

module.exports = generateAccessToken;
module.exports = generateRefreshToken;