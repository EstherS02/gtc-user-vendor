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

export function orderTrack(req, res) {
	var LoggedInUser = {};

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;

	async.series({
			category: function(callback) {
				service.findRows("Category", {}, 0, null, 'id', 'asc')
					.then(function(category) {
						return callback(null, category.rows);

					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(null);
					});
			}
		},
		function(err, results) {
			if (!err) {
				res.render('order-track', {
					title: "Global Trade Connect",
					category: results.category,
					LoggedInUser: LoggedInUser
				});
			} else {
				res.render('wishlist', err);
			}
		});
}