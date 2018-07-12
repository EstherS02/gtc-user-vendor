'use strict';

const passport = require('passport');
const config = require('../config/environment');
const expressJwt = require('express-jwt');
const compose = require('composable-middleware');
const _ = require('lodash');
const model = require('../sqldb/model-connect');
const status = require('../config/status');

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

				let queryObj = {};

				queryObj['status'] = {
					'$eq': status["ACTIVE"]
				}
				
				queryObj['id'] = req.gtcGlobalUserObj.userId;

				model['User'].findOne({
					where: queryObj,
					attributes: {
						exclude: ['hashed_pwd', 'salt', 'email_verified_token', 'email_verified_token_generated', 'forgot_password_token', 'forgot_password_token_generated']
					}
				}).then(function(userObj) {
					if (userObj) {
						req.gtcGlobalUserObj = userObj.toJSON();
						req.gtcGlobalUserObj['isAvailable'] = true;
						
						let vendorQueryObj = {};

						vendorQueryObj['status'] = {
							'$eq': status["ACTIVE"]
						}
						
						vendorQueryObj['user_id'] = req.gtcGlobalUserObj.id;

						model['Vendor'].findOne({
							where: vendorQueryObj,
							include: [
								{ model: model['Country'] },
								{ model: model['Currency'] },
								{ model: model['Timezone'] },
								{ model: model['VendorPlan']},
								{ model: model['VendorVerification']}
							]
						}).then(function(vendorObj) {
							if (vendorObj) {
								req.gtcGlobalUserObj['Vendor'] = vendorObj.toJSON();
								req.gtcGlobalUserObj['VendorStatus'] = true;
								next();
							} else {
								req.gtcGlobalUserObj['Vendor'] = false;
								next();
							}
						}).catch(function(error) {
							req.gtcGlobalUserObj['Vendor'] = false;
							next();
						});
						//next();
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