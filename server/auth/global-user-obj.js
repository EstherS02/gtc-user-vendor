'use strict';

const passport = require('passport');
const config = require('../config/environment');
const expressJwt = require('express-jwt');
const compose = require('composable-middleware');
const _ = require('lodash');
const model = require('../sqldb/model-connect');

var validateJwt = expressJwt({
	secret: config.secrets.accessToken,
	requestProperty: 'gtcGlobalUserObj',
	getToken: function (req) {
		if(req.cookies && req.cookies['gtc_access_token'] && req.cookies['gtc_refresh_token']){
			return req.cookies['gtc_access_token']; 
		}
		return null;
	  }
});

function isGlobalObj() {
	return compose()
		.use(function(req, res, next) {
				validateJwt(req, res, next);
		})
		.use(function(err, req, res, next){
			if(err.name === 'UnauthorizedError') {
				next();
			}
		})
	 	.use(function(req, res, next) {
			if(req.gtcGlobalUserObj && req.gtcGlobalUserObj.userId){
				model['User'].findOne({
					where: {
						id: req.gtcGlobalUserObj.userId
					}
				}).then(function(userObj) {
					if (userObj) {
						req.gtcGlobalUserObj = userObj.toJSON();
						req.gtcGlobalUserObj['isAvailable'] = true;
						next();
					} else {
						req.gtcGlobalUserObj = {};
						req.gtcGlobalUserObj['isAvailable'] = false;
						next();
					}
				}).catch(function(error) {
					req.gtcGlobalUserObj = {};
					req.gtcGlobalUserObj['isAvailable'] = false;
					next();
				});

			}else{
				req.gtcGlobalUserObj = {};
				req.gtcGlobalUserObj['isAvailable'] = false;
				next();
			} 
		});
}

function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}

exports.isGlobalObj = isGlobalObj;