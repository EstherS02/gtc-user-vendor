'use strict';

const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const reference = require('../../../config/model-reference');
const status = require('../../../config/status');
const service = require('../../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');
import series from 'async/series';
var async = require('async');

export function vendorAbout(req, res) {
	var vendor_id;
	if (req.params.id) {
		vendor_id = req.params.id
	}
	var LoggedInUser = {};


	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;

	async.series({
		VendorDetail: function(callback) {
			var vendorIncludeArr = [{
				model: model['Country']

			}, {
				model: model['VendorPlan'],

			}, {
				model: model['VendorVerification'],
				where: {
					vendor_verified_status: status['ACTIVE']
				},
				required:false
			}, {
				model: model['VendorFollower'],
				where: {
					// user_id: vendor_id,
					status: 1
				},
				required: false
			}];
			service.findIdRow('Vendor', vendor_id, vendorIncludeArr)
				.then(function(response) {
					return callback(null, response);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		Follower: function(callback) {
			var queryObj = {
				status: 1,
				vendor_id: vendor_id

			};
			var includeArr = [{
				model: model['User'],
				user_pic_url: {
					$ne: null
				},
				attributes: ['first_name', 'last_name', 'user_pic_url']
			}];
			service.findRows('VendorFollower', queryObj, 0, 5, 'id', 'desc', includeArr)
				.then(function(response) {
					return callback(null, response);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		}

	}, function(err, results) {
		console.log(LoggedInUser);
		if (!err) {
			res.render('vendorPages/vendor-about', {
				title: "Global Trade Connect",
				VendorDetail: results.VendorDetail,
				follower: results.Follower,
				LoggedInUser: LoggedInUser,
				selectedPage: 'about'
			});
		} else {

			res.render('vendor-about', err);
		}
	});
}