'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
var async = require('async');
const vendorPlan = require('../../config/gtc-plan');

export function notifications(req, res) {
	var LoggedInUser = {};

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;
	if (req.user.Vendor.id) {
		//pagination 
		var page;
		var offset;
		var limit;
		var order = "asc";
		var field = "id";
		var modelName = 'Notification';
		var queryObj = {};
		var includeArr = [{
			model: model["VendorNotificationSetting"],
			where: {
				vendor_id: req.user.Vendor.id
			},
			required: false
		}];

		var queryObjCategory = {
			status: statusCode['ACTIVE']
		};

		async.series({
			notifications: function(callback) {

				service.findRows(modelName, queryObj, 0, null, field, order, includeArr)
					.then(function(results) {
						return callback(null, results);

					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(null);
					});
			},
			category: function(callback) {
				service.findRows("Category", queryObjCategory, 0, null, 'id', 'asc')
					.then(function(category) {
						return callback(null, category.rows);

					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(null);
					});
			}
		}, function(err, results) {
			if (!err) {
				res.render('vendorNav/notifications', {
					title: "Global Trade Connect",
					title: "Global Trade Connect",
					count: results.notifications.count,
					notification: results.notifications.rows,
					category: results.category,
					LoggedInUser: LoggedInUser,
					selectedPage: 'notifications',
					vendorPlan: vendorPlan
				});
			} else {
				res.render('notifications', err);
			}

		});
	}
}

function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}