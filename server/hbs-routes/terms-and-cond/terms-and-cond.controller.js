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
const vendorPlan = require('../../config/gtc-plan');

export function termsAndCond(req, res) {
	var LoggedInUser = {};
	var bottomCategory = {};

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;
	var queryObjCategory = {
		status: statusCode['ACTIVE']
	};
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

			}
		},
		function(err, results) {
			console.log(results)
			if (!err) {
				res.render('vendorNav/terms-and-cond', {
					title: "Global Trade Connect",
					LoggedInUser: LoggedInUser,
					categories: results.categories,
					bottomCategory: bottomCategory,
					selectedPage: 'terms-and-cond',
					vendorPlan: vendorPlan
				});
			} else {
				res.render('vendorNav/terms-and-cond', err);
			}
		});

}