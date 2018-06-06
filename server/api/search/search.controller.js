'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');

export function search(req, res) {
	model["Product"].findAll({
		
	})
		.then(function (row) {
			res.status(200).send(row);
			return;
		}).catch(function (error) {
			if (error) {
				res.status(500).send(error);
				return;
			}
		});
}
