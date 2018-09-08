'use strict';

const async = require('async');
const _ = require('lodash');
const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const reference = require('../../../config/model-reference');
const status = require('../../../config/status');
const service = require('../../../api/service');
const populate = require('../../../utilities/populate');

export function confirmation(req, res) {
	var LoggedInUser = {};

	if (req.user)
		LoggedInUser = req.user;
		var bottomCategory = {};
		let user_id = LoggedInUser.id;
		async.series({
			cartCounts: function(callback) {
				service.cartHeader(LoggedInUser).then(function(response) {
					return callback(null, response);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
			},
			categories: function(callback) {
				var categoryModel = "Category";
				var includeArr = [];
				const categoryOffset = 0;
				const categoryLimit = null;
				const categoryField = "id";
				const categoryOrder = "asc";
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
				res.render('checkout/confirmation', {
					title: "Global Trade Connect",
					categories: results.categories,
					bottomCategory: bottomCategory,
					cartheader:results.cartCounts,
					LoggedInUser:LoggedInUser
				});
			} else {
				res.render('checkout/confirmation', err);
			}
		});

}