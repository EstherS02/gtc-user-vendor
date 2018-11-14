'use strict';

var async = require('async');
const config = require('../../config/environment');
const vendorPlan = require('../../config/gtc-plan');
const statusCode = require('../../config/status');
const notifictionService = require('../../api/notification/notification.service');

export function vendorLanding(req, res) {
	var LoggedInUser = {};
	var counts = {};
	if (req.user)
		LoggedInUser = req.user;

	async.series({
		unreadCounts: function(callback) {
			if (req.user) {
				notifictionService.notificationCounts(LoggedInUser.id)
					.then(function(counts) {
						return callback(null, counts);
					}).catch(function(error) {
						return callback(null);
					});
			} else {
				return callback(null);
			}
		}
	}, function(err, results) {
		if (!err) {
			res.render('vendorNav/vendor-landing', {
				title: "Global Trade Connect",
				LoggedInUser: LoggedInUser,
				AmazonDeveloperID: config.amazonImportConfig.developerId,
				unreadCounts: results.unreadCounts,
				vendorPlan: vendorPlan,
				statusCode: statusCode
			});
		} else {
			res.render('vendorNav/vendor-landing', err);
		}
	})
}