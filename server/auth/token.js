'use strict';

import jwt from 'jsonwebtoken';

function generateToken(user, client, secret, expiresIn) {
	var tokenPayload = {
		userId: user.id,
		email: user.email,
		client: client
	};
	var token = jwt.sign(tokenPayload, secret);
	return token;
}

module.exports = generateToken;