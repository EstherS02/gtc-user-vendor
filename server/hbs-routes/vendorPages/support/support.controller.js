'use strict';

const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const status = require('../../../config/status');
const verificationStatus = require('../../../config/verification_status');
const service = require('../../../api/service');
const sequelize = require('sequelize');
const cartService = require('../../../api/cart/cart.service');
const marketplace = require('../../../config/marketplace');
const Plan = require('../../../config/gtc-plan');
const moment = require('moment');
const async = require('async');

export function vendorSupport(req, res) {
	var LoggedInUser = {};
	var categoryModel = "Category";
	var bottomCategory = {};
	if (req.user)
		LoggedInUser = req.user;

	var queryObj = {};
	var modelName = 'TermsAndCond';
	let user_id = LoggedInUser.id;
	var vendor_id = req.params.id;

	queryObj['vendor_id'] = vendor_id
	queryObj['status'] = status['ACTIVE'];


	async.series({
		Support: function(callback) {
			service.findRow(modelName, queryObj, []).then(function(response) {
				console.log(response)
				if (response) {
					return callback(null, response);
				} else {
					return callback(null);
				}
			}).catch(function(error) {
				console.log('Error :::', error);
				return callback(null);
			});
		},
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
		VendorDetail: function(callback) {
			var vendorIncludeArr = [{
				model: model['Country']

			}, {
				model: model['VendorPlan'],
				where: {
						status: status['ACTIVE'],
						start_date: {
							'$lte': moment().format('YYYY-MM-DD')
						},
						end_date: {
							'$gte': moment().format('YYYY-MM-DD')
						}
					},
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
		}
	}, function(err, results) {
		if (!err) {
			res.render('vendorPages/vendor-support', {
				title: "Global Trade Connect",
				VendorDetail: results.VendorDetail,
				Support: results.Support,
				bottomCategory: bottomCategory,
				categories: results.categories,
				LoggedInUser: LoggedInUser,
				cart: results.cartInfo,
				marketPlace: marketplace,
				selectedPage: 'support',
				Plan: Plan,
			});
		} else {
			res.render('vendor-support', err);
		}
	});
}