'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');

export function index(req, res) {
	model[req.endpoint].findAndCountAll()
		.then(function(rows) {
			if (rows) {
				res.status(200).send(rows);
				return
			}
		})
		.catch(function(error) {
			if (error) {
				console.log('error', error);
				res.status(500).send("Internal server error");
				return;
			}
		});
}

export function create(req, res, next) {
	var bodyParams = req.body;

	model[req.endpoint].create(bodyParams)
		.then(function(row) {
			console.log('row', plainTextResponse(row));
		})
		.catch(function(error) {
			console.log('error', error);
		});
}

function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}