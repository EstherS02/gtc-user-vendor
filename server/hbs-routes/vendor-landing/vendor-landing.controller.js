'use strict';

var async = require('async');
const config = require('../../config/environment');
const vendorPlan = require('../../config/gtc-plan');
const statusCode = require('../../config/status');
const notifictionService = require('../../api/notification/notification.service');
const service = require('../../api/service');

export function vendorLanding(req, res) {
	var LoggedInUser = {};
	var counts = {};
	var bottomCategory = {};
	if (req.user)
		LoggedInUser = req.user;

	async.series({
		categories: function(callback) {
			var includeArr = [];
			const categoryOffset = 0;
			const categoryLimit = null;
			const categoryField = "id";
			const categoryOrder = "asc";
			var categoryModel = "Category";
			const categoryQueryObj = {};

			categoryQueryObj['status'] = statusCode["ACTIVE"];

			service.findAllRows(categoryModel, includeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
				.then(function(category) {
					var categories = category.rows;
					bottomCategory['left'] = categories.slice(0, 8);
					bottomCategory['right'] = categories.slice(8, 16);
					return callback(null, category.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
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
				categories: results.categories,
				bottomCategory: bottomCategory,
				vendorPlan: vendorPlan,
				statusCode: statusCode
			});
		} else {
			res.render('vendorNav/vendor-landing', err);
		}
	})
}