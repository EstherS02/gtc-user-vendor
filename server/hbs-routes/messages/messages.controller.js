'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const sequelize = require('sequelize');
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
						user_id: LoggedInUser.id
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
								$ne: LoggedInUser.id
							}
						},
						include: [{
							model: model['User'],
							attributes: ["id", "role", "first_name", "last_name", "user_pic_url", "email"]
						}, {
							model: model['TalkThread'],
							attributes: ["id", "group_name", "status"],
							include: [{
								model: model['Talk'],
								attributes: ['id', 'from_id', 'is_read', 'message', 'sent_at', 'talk_thread_id']
							}]
						}],
						order: [
							[field, order],
							[model['TalkThread'],model['Talk'], "id", "desc"]
						]
					}).then(function(results1) {
			 			return callback(null,results1);
					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(null);
					});
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
			}
		},
		function(err, results) {

			if (!err) {
				console.log(JSON.stringify(results.messages));
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