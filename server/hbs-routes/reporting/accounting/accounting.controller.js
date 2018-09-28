'use strict';

var async = require('async');
const moment = require('moment');
const sequelize = require('sequelize');

const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const reference = require('../../../config/model-reference');
const statusCode = require('../../../config/status');
const service = require('../../../api/service');
const marketPlace = require('../../../config/marketplace');
const orderStatus = require('../../../config/order_status');
const vendorPlan = require('../../../config/gtc-plan');
const cartService = require('../../../api/cart/cart.service');
const marketplace = require('../../../config/marketplace');

export function accounting(req, res) {
	var queryURI = {};
	var bottomCategory = {};
	var LoggedInUser = req.user;
	var categoryModel = "Category";

	async.series({
		cartInfo: function(callback) {
			cartService.cartCalculation(LoggedInUser.id, req)
				.then((cartResult) => {
					return callback(null, cartResult);
				}).catch((error) => {
					return callback(error);
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
	}, function(error, results) {
		var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
		var dropDownUrl = fullUrl.replace(req.url, '').replace(req.protocol + '://' + req.get('host'), '').replace('/', '');
		if (!error && results) {
			return res.render('vendorNav/reporting/accounting', {
				title: "Global Trade Connect",
				category: results.category,
				selectedPage: 'accounting',
				bottomCategory: bottomCategory,
				selectedPage: 'accounting',
				orderStatus: orderStatus,
				vendorPlan: vendorPlan,
				LoggedInUser: LoggedInUser,
				dropDownUrl: dropDownUrl,
				cart: results.cartInfo,
				marketPlace: marketplace,
				statusCode: statusCode
			});
		} else {
			return res.render('vendorNav/reporting/accounting', error);
		}
	});
}