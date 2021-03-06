'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const cartService = require('../../api/cart/cart.service');
const marketplace = require('../../config/marketplace');
const sequelize = require('sequelize');
const vendorPlan = require('../../config/gtc-plan');
const async = require('async');
const notifictionService = require('../../api/notification/notification.service');

export function messages(req, res) {
	var categoryModel = "Category";
	var LoggedInUser = {};
	var bottomCategory = [];
	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;
	var threads = [];
	var threadsUnRead = [];
	var field = "created_on";
	var order = "desc";
	async.series({
			cartInfo: function(callback) {
				cartService.cartCalculation(LoggedInUser.id, req, res)
					.then((cartResult) => {
						return callback(null, cartResult);
					}).catch((error) => {
						console.log("cartInfo Error:::", error);
						return callback(error);
					});
			},
			messages_count: function(callback) {
				model['TalkThreadUser'].findAll({
					where: {
						user_id: LoggedInUser.id
					}
				}).then(function(instances) {
					for (var i = 0, iLen = instances.length; i < iLen; i++) {
						threadsUnRead.push(instances[i].thread_id);
					}
				}).then(function(results) {
					model['Talk'].findAll({
						raw: true,
						where: {
							from_id: {
								$ne: LoggedInUser.id
							},
							talk_thread_id: {
								$in: threadsUnRead
							},
							is_read: 0
						},
						attributes: ['talk_thread_id', [sequelize.fn('count', 1), 'count']],
						group: ['talk_thread_id']
					}).then(function(results1) {
						return callback(null, results1);
					});
				})
			},
			messages: function(callback) {
				model['TalkThreadUser'].findAll({
					where: {
						user_id: LoggedInUser.id
					},
				}).then(function(instances) {
					for (var i = 0, iLen = instances.length; i < iLen; i++) {
						threads.push(instances[i].thread_id);
					}
				}).then(function(results) {
					model['TalkThreadUser'].findAll({
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
								attributes: ['id', 'from_id', 'is_read', 'message', 'sent_at', 'talk_thread_id','created_on']
							}]
						}],
						order: [
							[field, order],
							[model['TalkThread'], model['Talk'], "id", "desc"]
						]
					}).then(function(results1) {
						return callback(null, results1);
					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(null);
					});
				});
			},
			categories: function(callback) {
				var includeArr = [];
				var categoryOffset, categoryLimit, categoryField, categoryOrder;
				var categoryQueryObj = {};

				categoryOffset = 0;
				categoryLimit = null;
				categoryField = "id";
				categoryOrder = "asc";

				categoryQueryObj['status'] = statusCode["ACTIVE"];

				service.findAllRows('Category', includeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
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
				notifictionService.notificationCounts(LoggedInUser.id)
					.then(function(counts) {
						return callback(null, counts);
					}).catch(function(error) {
						return callback(null);
					});
			}
		},
		function(err, results) {

			if (!err) {
				res.render('vendorNav/messages', {
					title: "Global Trade Connect",
					messenger: results.messages,
					messages_count: results.messages_count,
					categories: results.categories,
					unreadCounts: results.unreadCounts,
					bottomCategory: bottomCategory,
					cart: results.cartInfo,
					marketPlace: marketplace,
					LoggedInUser: LoggedInUser,
					vendorPlan: vendorPlan,
				});
			} else {
				res.render('vendorNav/messages', err);
			}
		});
}