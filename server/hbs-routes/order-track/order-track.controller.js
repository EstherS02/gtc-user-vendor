'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const sequelize = require('sequelize');
const async = require('async');
const vendorPlan = require('../../config/gtc-plan');
const orderStatus = require('../../config/order_status');
const carriersCode = require('../../config/carriers');
const trackingUrl = require('../../config/tracking-url');

export function orderTrack(req, res) {
	var LoggedInUser = {}, order_id;
	var bottomCategory = {}, userOrderObj = {};

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
		orderTrack: function(callback) {
			var includeArr = [
				{
					model: model['Address'],
					as: 'shippingAddress',
					include: [
						{ model: model['State'] },
						{ model: model['Country'] },
					]
				},
				{ 	model: model['Shipping'] 	},
				{
					model: model['OrderItem'],
					include: [{
						model: model['Product'],
						include: [{
							model: model['ProductMedia'],
						}]
					}]
				}
			];

			if (req.params.id) {

				order_id = req.params.id;
				service.findIdRow(orderModel, order_id, includeArr)
					.then(function(result) {
						return callback(null, result);
					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(null);
					});

			} else{

				userOrderObj['user_id'] = user_id;
				userOrderObj['order_status'] = {
					'$lt': orderStatus["DELIVEREDORDER"]
				}
				userOrderObj['status'] = statusCode["ACTIVE"];

				model['Order'].findOne({
					include: includeArr,
					where: userOrderObj,
					order: [['created_on', 'DESC']],
				}).then(function(result) {
					if (result) {
						return callback(null, result.toJSON());
					} else {
						return callback(null);
					}
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
			}
		}
	},function(err, results) {
		if (!err) {
			res.render('order-track', {
				title: "Global Trade Connect",
				categories: results.categories,
				bottomCategory: bottomCategory,
				LoggedInUser: LoggedInUser,
				cartheader: results.cartCounts,
				orderTrack: results.orderTrack,
				vendorPlan: vendorPlan,
				orderStatus: orderStatus,
				carriersCode: carriersCode,
				trackingUrl: trackingUrl
			});
		} else {
			res.render('order-track', err);
		}
	});
}