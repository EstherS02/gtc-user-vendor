'use strict';

const _ = require('lodash');
const compose = require('composable-middleware');
const endpoints = require('../config/endpoints');

function validateEndpoint() {
	return compose()
		.use(function(req, res, next) {
			if (_.isUndefined(endpoints[req.params.endpoint])) {
				res.status(404).send("Endpoint not found");
				return;
			} else {
				req.endpoint = endpoints[req.params.endpoint];
				next();
			}
		});
}

function validateCart() {
	return compose()
		.use(function(req, res, next) {
			
		});
}

exports.validateEndpoint = validateEndpoint;
exports.validateCart = validateCart;