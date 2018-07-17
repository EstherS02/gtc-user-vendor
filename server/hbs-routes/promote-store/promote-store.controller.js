'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');
var async = require('async');
const vendorPlan = require('../../config/gtc-plan');

export function promoteStore(req, res) {
	var LoggedInUser = {};

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;

	var queryObjCategory = {
		status: statusCode['ACTIVE']
	};
	async.series({
			category: function(callback) {
				service.findRows("Category", queryObjCategory, 0, null, 'id', 'asc')
					.then(function(category) {
						return callback(null, category.rows);

					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(null);
					});
			}

		},
		function(err, results) {
			console.log(results)
			if (!err) {
				res.render('promote-store', {
					title: "Global Trade Connect",
					LoggedInUser: LoggedInUser,
					category: results.category,
					selectedPage: 'promote-store',
					vendorPlan: vendorPlan
				});
			} else {
				res.render('promote-store', err);
			}
		});

}