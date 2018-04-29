'use strict';

const crypto = require('crypto');
const expressValidator = require('express-validator');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');

export function create(req, res) {
	req.checkBody('type', 'Missing Query Param').notEmpty();
	req.checkBody('name', 'Missing Query Param').notEmpty();

	var errors = req.validationErrors();
	if (errors) {
		res.status(400).send('Missing Query Params');
		return;
	}

	req.body.secret = crypto.randomBytes(32).toString('base64');

	const bodyParams = req.body;
	model['Appclient'].create(bodyParams)
		.then(function(row) {
			if (row) {
				res.status(201).send(plainTextResponse(row));
				return;
			}
		})
		.catch(function(error) {
			console.log("Error:::", error);
			res.status(500).send("Internal server error");
			return;
		});
}

function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}