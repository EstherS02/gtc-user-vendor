'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');
const async = require('async');
const vendorPlan = require('../../config/gtc-plan');

export function orderTrack(req, res) {
	var LoggedInUser = {};
	var bottomCategory = {};

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;
	var orderModel = "Order";
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
			orderTrack: function (callback) {
				var queryObj={
					id: 142
				};
				var includeArr = [];
				service.findRow(orderModel, queryObj, includeArr)
				.then(function(result) {
						return callback(null, result);
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
					categories: results.categories,
					bottomCategory: bottomCategory,
					LoggedInUser: LoggedInUser,
					cartheader: results.cartCounts,
					orderTrack:results.orderTrack,
					vendorPlan: vendorPlan
				});
			} else {
				res.render('wishlist', err);
			}
		});
}