'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');
import series from 'async/series';
var async = require('async');
const verificationStatus = require('../../config/verification_status');
const vendorPlan = require('../../config/gtc-plan');

export function verification(req, res) {
    var LoggedInUser = {};

    if(req.user)
    LoggedInUser = req.user;
    let user_id = LoggedInUser.id;

	var modelName = "VendorVerification";
	var queryObj = {};

	let vendor_id = LoggedInUser.Vendor.id;


	queryObj = {
		vendor_id :vendor_id
	};
	var includeArr = [];

    	async.series({
			verification: function(callback) {
				service.findOneRow(modelName, queryObj, includeArr)
					.then(function(response) {
						if(response){
						return callback(null, response);
						}else
						{
							return callback(null,null);
						}
					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(null);
					});
			}	
		},
		function(err, results) {
			if (!err) {
				res.render('verification', {
					title: "Global Trade Connect",
					verification: results.verification,
					LoggedInUser: LoggedInUser,
					status:statusCode,
					verificationStatus: verificationStatus,
					vendorPlan:vendorPlan
				});
			} else {
				res.render('verification', err);
			}
		});

}