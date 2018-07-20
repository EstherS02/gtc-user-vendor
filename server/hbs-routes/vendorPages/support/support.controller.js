'use strict';

const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const reference = require('../../../config/model-reference');
const status = require('../../../config/status');
const service = require('../../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');
import series from 'async/series';
var async = require('async');

export function vendorSupport(req, res) {
	var LoggedInUser = {};
	var categoryModel = "Category";
	var bottomCategory = {};
	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;
	var vendor_id = req.params.id;

	async.series({
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
				required: false
			}, {
				model: model['VendorVerification'],
				where: {
					vendor_verified_status: status['ACTIVE']
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
					[sequelize.fn('AVG', sequelize.col('VendorRatings.rating')), 'rating']
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
				bottomCategory: bottomCategory,
				categories: results.categories,
				LoggedInUser: LoggedInUser,
				selectedPage: 'support'
			});
		} else {
			res.render('vendor-support', err);
		}
	});
}