'use strict';

var endPointModel = require('../config/end_point.js');
var compose = require('composable-middleware');
var _ = require('lodash');
var sendRsp = require('../utils/response').sendRsp;


function validateResource() {
	return compose()
		.use(function(req, res, next) {
			console.log("Coming1"+req.params.entityEndPoint);
            if (_.isUndefined(endPointModel[req.params.entityEndPoint])) {
            	console.log("Coming2");
				sendRsp(res, 404, 'Resource Not Found');
				return;
			}
            else {
            	console.log("Coming3");
				req.entityEndPoint = endPointModel[req.params.entityEndPoint];
				next();
			}
		});
}
exports.validateResource = validateResource;	