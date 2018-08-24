'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
var async = require('async');
const vendorPlan = require('../../config/gtc-plan');

export function messages(req, res) {
	var categoryModel = "Category";
	var LoggedInUser = {};
	var bottomCategory = [];
	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;
	var threads = [];
	var field ="created_on";
	var order = "desc";
	async.series({
			cartCounts: function(callback) {
				service.cartHeader(LoggedInUser).then(function(response) {
					return callback(null, response);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
			},
			messages: function(callback) {
				model['TalkThreadUsers'].findAll({
					where: {
						user_id: 62
					},
				}).then(function(instances) {
					for (var i = 0, iLen = instances.length; i < iLen; i++) {
						threads.push(instances[i].thread_id);
					}
				}).then(function(results) {
					model['TalkThreadUsers'].findAll({
						where: {
							thread_id: threads,
							user_id: {
								$ne: 62
							}
						},
						include: [{
							model: model['User']
						}, {
							model: model['TalkThread'],
							include: [{
								model: model['Talk']
							}]
						}],
						order: [
							[field, order],
							[model['TalkThread'],model['Talk'], "sent_at", "desc"]
						]
					}).then(function(results1) {
						return callback(null,results1);
					})
				});
			},
			categories: function(callback) {
				var includeArr = [];
				const categoryOffset = 0;
				const categoryLimit = null;
				const categoryField = "id";
				const categoryOrder = "asc";
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
		},
		function(err, results) {

			if (!err) {
				console.log(JSON.parse(JSON.stringify(results.messages)));
				res.render('vendorNav/messages', {
					title: "Global Trade Connect",
					messenger: results.messages,
					categories: results.categories,
					bottomCategory: bottomCategory,
					cartheader: results.cartCounts,
					LoggedInUser: LoggedInUser,
					vendorPlan: vendorPlan,
				});
			} else {
				res.render('vendorNav/messages', err);
			}
		});
}