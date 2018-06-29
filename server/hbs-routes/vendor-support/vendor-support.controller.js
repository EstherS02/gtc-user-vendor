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

export function vendorSupport(req, res) {
    var LoggedInUser = {};

    if(req.user)
    LoggedInUser = req.user;
    
    let user_id = LoggedInUser.id;
var vendor_id = req.params.id;
    
async.series({
		VendorDetail: function(callback) {
			var vendorIncludeArr = [{
				model: model['Country']

			}, {
				model: model['VendorPlan'],

			}];
			service.findIdRow('Vendor', vendor_id, vendorIncludeArr)
				.then(function(response) {
					return callback(null, response);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		}
	}, function(err, results) {

		if (!err) {
			res.render('vendor-support', {
				title: "Global Trade Connect",
				VendorDetail : results.VendorDetail,
				LoggedInUser: LoggedInUser
			});
		} else {
			res.render('vendor-support', err);
		}
	});
}