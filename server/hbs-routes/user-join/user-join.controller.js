'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const status = require('../../config/status');
const addressCode = require('../../config/address');
const service = require('../../api/service');
const async = require('async');
const populate = require('../../utilities/populate');

export function userJoin(req, res) {

	var LoggedInUser = {};
	var bottomCategory = {};

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;

	async.series({
			categories: function(callback) {
				var includeArr = [];
				const categoryOffset = 0;
				const categoryLimit = null;
				const categoryField = "id";
				const categoryOrder = "asc";
				var categoryModel = "Category";
				const categoryQueryObj = {};

				categoryQueryObj['status'] = status["ACTIVE"];

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
			}
		},
		function(err, results) {
			if (!err) {
				res.render('users/user-join', {
					title: "Global Trade Connect",
					LoggedInUser: LoggedInUser,
					categories: results.categories,
					bottomCategory: bottomCategory,
				});
			} else {
				res.render('users/user-join', err);
			}
		});
}