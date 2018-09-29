'use strict';

var async = require('async');
const moment = require('moment');
const sequelize = require('sequelize');
const querystring = require('querystring');

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
	var queryParams = {};
	var bottomCategory = {};
	var LoggedInUser = req.user;
	var categoryModel = "Category";
	const dateRangeOptions = [{
		"column": "Today",
		"value": 1
	}, {
		"column": "Yesterday",
		"value": 2
	}, {
		"column": "Last 7 Days",
		"value": 3
	}, {
		"column": "Last 30 Days",
		"value": 4
	}, {
		"column": "This Month",
		"value": 5
	}, {
		"column": "Last Month",
		"value": 6
	}, {
		"column": "Custom Range",
		"value": 7
	}];

	if (req.query.range) {
		queryParams['range'] = req.query.range;
	} else {
		queryParams['range'] = 4;
	}

	if (req.query.start_date) {
		queryParams['start_date'] = req.query.start_date;
	} else {
		queryParams['start_date'] = moment().subtract(30, 'days').format('DD-MM-YYYY');
	}

	if (req.query.end_date) {
		queryParams['end_date'] = req.query.end_date;
	} else {
		queryParams['end_date'] = moment().subtract(1, 'days').format('DD-MM-YYYY');
	}

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
				categories: results.categories,
				bottomCategory: bottomCategory,
				selectedPage: 'accounting',
				orderStatus: orderStatus,
				vendorPlan: vendorPlan,
				LoggedInUser: LoggedInUser,
				dropDownUrl: dropDownUrl,
				cart: results.cartInfo,
				marketPlace: marketplace,
				statusCode: statusCode,
				queryParams: queryParams,
				queryURI: querystring.stringify(queryParams),
				dateRangeOptions: dateRangeOptions
			});
		} else {
			return res.render('vendorNav/reporting/accounting', error);
		}
	});
}