'use strict';

const _ = require('lodash');
const async = require('async');

const status = require('../../../config/status');
const marketplace = require('../../../config/marketplace');
const service = require('../../../api/service');
const cartService = require('../../../api/cart/cart.service');

export function confirmation(req, res) {
	var LoggedInUser = {};
	var bottomCategory = {};

	console.log(req.params.id)

	if (req.user) {
		LoggedInUser = req.user;
	}
	var vendorID = JSON.parse(req.params.id);
	let user_id = LoggedInUser.id;

	async.series({
			cartInfo: function(callback) {
				if (LoggedInUser.id) {
					cartService.cartCalculation(LoggedInUser.id)
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
			vendors: function(callback) {
				// var vendorModel = "Vendor";
				// var includeArr=[];
				// var queryObj = {};
				var vendorIncludeArr = [{
					model: model['VendorFollower'],
					where: {
						user_id: req.user.id,
						status: 1
					},
					required: false
				}];
				var queryObj = {
					id: vendorID
				};
				service.findRows('Vendor', queryObj, 0, null, 'created_on', 'asc', vendorIncludeArr)
					.then(function(response) {
						return callback(null, response);
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
					vendors: results.vendors,
					cart: results.cartInfo,
					marketPlace: marketplace,
					LoggedInUser: LoggedInUser
				});
			} else {
				res.render('checkout/confirmation', err);
			}
		});
}