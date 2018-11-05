'use strict';

const _ = require('lodash');
const async = require('async');
const sequelize = require('sequelize');

const model = require('../../../sqldb/model-connect');
const status = require('../../../config/status');
const marketplace = require('../../../config/marketplace');
const service = require('../../../api/service');
const vendorservice = require('../../../api/vendor/vendor-service');
const cartService = require('../../../api/cart/cart.service');

export function confirmation(req, res) {
	var bottomCategory = {};
	const LoggedInUser = req.user;
	const orderID = req.params.order_id;

	async.series({
		cartInfo: function(callback) {
			if (LoggedInUser.id) {
				cartService.cartCalculation(LoggedInUser.id, req, res)
					.then((cartResult) => {
						return callback(null, cartResult);
					}).catch((error) => {
						return callback(error);
					});
			} else {
				return callback(null);
			}
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
		},
		orderVendors: function(callback) {
			const orderVendorModelName = "OrderVendor";
			const groupBy = "id";
			const includeArray = [{
				model: model['Order'],
				where: {
					user_id: req.user.id
				},
				attributes: ['id', 'user_id']
			}, {
				model: model['Vendor'],
				attributes: ['id', 'user_id', 'vendor_name', 'vendor_profile_pic_url', [sequelize.fn('COUNT', sequelize.col('Vendor->VendorFollowers.id')), 'is_vendor_follower']],
				include: [{
					model: model['VendorFollower'],
					where: {
						user_id: req.user.id,
						status: status['ACTIVE']
					},
					required: false,
					attributes: []
				}]
			}];

			vendorservice.orderVendorFollowers(orderVendorModelName, {
				order_id: orderID
			}, includeArray, groupBy).then((response) => {
				return callback(null, response);
			}).catch((error) => {
				return callback(error);
			})
		}
	}, function(error, results) {
		if (!error && results) {
			res.render('checkout/confirmation', {
				title: "Global Trade Connect",
				categories: results.categories,
				bottomCategory: bottomCategory,
				cart: results.cartInfo,
				marketPlace: marketplace,
				orderVendors: results.orderVendors,
				LoggedInUser: LoggedInUser

			});
		} else {
			return res.render('checkout/confirmation/' + orderID, error);
		}
	});
}