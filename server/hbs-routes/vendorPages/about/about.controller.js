'use strict';

const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const status = require('../../../config/status');
const verificationStatus = require('../../../config/verification_status');
const service = require('../../../api/service');
const Plan = require('../../../config/gtc-plan');
const marketplace = require('../../../config/marketplace');
const cartService = require('../../../api/cart/cart.service');
const sequelize = require('sequelize');
const async = require('async');

export function vendorAbout(req, res) {
	var vendor_id;
	if (req.params.id) {
		vendor_id = req.params.id
	}
	var LoggedInUser = {};
	var bottomCategory = {};

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;

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
		VendorDetail: function(callback) {
			var vendorIncludeArr = [{
				model: model['Country']

			}, {
				model: model['VendorPlan'],
				required: false
			}, {
				model: model['VendorVerification'],
				where: {
					// vendor_verified_status: status['ACTIVE']
					vendor_verified_status: verificationStatus['APPROVED']
				},
				required: false
			}, {
				model: model['VendorFollower'],
				where: {
					user_id: req.user.id,
					status: 1
				},
				required: false
			}, {
				model: model['VendorRating'],
				attributes: [
					[sequelize.fn('AVG', sequelize.col('VendorRatings.rating')), 'rating'],
					[sequelize.fn('count', sequelize.col('VendorRatings.rating')), 'count']
				],
				group: ['VendorRating.vendor_id'],
				required: false,
			}];
			service.findIdRow('Vendor', vendor_id, vendorIncludeArr)
				.then(function(response) {
					return callback(null, response);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		Follower: function(callback) {
			var queryObj = {
				status: 1,
				vendor_id: vendor_id

			};
			var includeArr = [{
				model: model['User'],
				user_pic_url: {
					$ne: null
				},
				attributes: ['first_name', 'last_name', 'user_pic_url']
			}];
			service.findRows('VendorFollower', queryObj, 0, 5, 'id', 'desc', includeArr)
				.then(function(response) {
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
	}, function(err, results) {
		if (!err) {
			res.render('vendorPages/vendor-about', {
				categories: results.categories,
				bottomCategory: bottomCategory,
				title: "Global Trade Connect",
				VendorDetail: results.VendorDetail,
				follower: results.Follower,
				cart: results.cartInfo,
				marketPlace: marketplace,
				LoggedInUser: LoggedInUser,
				selectedPage: 'about',
				Plan: Plan,
			});
		} else {
			res.render('vendor-about', err);
		}
	});
}