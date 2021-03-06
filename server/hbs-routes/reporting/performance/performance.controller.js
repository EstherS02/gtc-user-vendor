'use strict';

const querystring = require('querystring');
const statusCode = require('../../../config/status');
const service = require('../../../api/service');
const moment = require('moment');
const marketplace = require('../../../config/marketplace');
const cartService = require('../../../api/cart/cart.service');
const async = require('async');
const vendorPlan = require('../../../config/gtc-plan');
const ReportService = require('../../../utilities/reports');
const notifictionService = require('../../../api/notification/notification.service');

export function performance(req, res) {
	var offset, limit, field, order;
	var queryParams = {};
	var LoggedInUser = {};
	var bottomCategory = {};
	var categoryModel = "Category";
	var lhsBetween = [];
	var rhsBetween = [];
	var queryURI = {};
	var selectedMetrics;
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
		}
	];

	selectedMetrics = req.query.top ? req.query.top : "products";
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;
	field = 'id';
	order = 'asc';

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;

	if (req.query.lhs_from && req.query.lhs_to) {
		lhsBetween.push(moment(req.query.lhs_from).toISOString(), moment(req.query.lhs_to).toISOString());
		queryURI['range'] = 7;
	}else{
		lhsBetween.push(moment().subtract(30, 'days').toISOString(), moment().toISOString());
		queryURI['range'] = 4;
	}

	if (req.query.rhs_from && req.query.rhs_to) {
		rhsBetween.push(moment(req.query.rhs_from).toISOString(), moment(req.query.rhs_to).toISOString());
		queryURI['rhs_from'] = moment(rhsBetween[0]).format("MM/DD/YYYY");
		queryURI['rhs_to'] = moment(rhsBetween[1]).format("MM/DD/YYYY");
	}
	
	if (req.query.range) {
		queryURI['range'] = req.query.range;
	}
	
	queryURI['offset'] = offset;
	queryURI['limit'] = limit;
	queryURI['lhs_from'] = moment(lhsBetween[0]).format("MM/DD/YYYY");
	queryURI['lhs_to'] = moment(lhsBetween[1]).format("MM/DD/YYYY");
	queryURI['top'] = selectedMetrics;

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
		},
		unreadCounts: function(callback) {
			notifictionService.notificationCounts(LoggedInUser.id)
				.then(function(counts) {
					return callback(null, counts);
				}).catch(function(error) {
					return callback(null);
				});
		},
		topItems: function(callback) {
			let performanceQueryObj = {};
			if (req.user.role == 2)
				performanceQueryObj.vendor_id = req.user.Vendor.id;

			if(req.query.compare == 'true'){
				performanceQueryObj.compare = req.query.compare;
				queryURI['compare'] = req.query.compare;
			}
			
			if (req.query.top == "marketplaces") {
				ReportService.marketplacePerformanceChanges(performanceQueryObj, lhsBetween, rhsBetween, limit, offset)
					.then(function(results) {
						return callback(null, results);
					}).catch(function(error) {
						return callback(error);
					});
			} else if (req.query.top == "countries") {
				ReportService.countryPerformanceChanges(performanceQueryObj, lhsBetween, rhsBetween, limit, offset)
					.then(function(results) {
						return callback(null, results);
					}).catch(function(error) {
						return callback(error);
					});
			} else if (req.query.top == "cities") {
				ReportService.cityPerformanceChanges(performanceQueryObj, lhsBetween, rhsBetween, limit, offset)
					.then(function(results) {
						return callback(null, results);
					}).catch(function(error) {
						return callback(error);
					});
			} else if (req.query.top == "buyers") {
				ReportService.userPerformanceChanges(performanceQueryObj, lhsBetween, rhsBetween, limit, offset)
					.then(function(results) {
						return callback(null, results);
					}).catch(function(error) {
						return callback(error);
					});
			} 
			else {
				ReportService.productPerformanceChanges(performanceQueryObj, lhsBetween, rhsBetween, limit, offset)
					.then(function(results) {
						return callback(null, results);
					}).catch(function(error) {
						return callback(error);
					});
			}
		}
	},function(err, results) {

		var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
		var dropDownUrl = fullUrl.replace(req.url, '').replace(req.protocol + '://' + req.get('host'), '').replace('/', '');
		if (!err) {
			res.render('vendorNav/reporting/performance', {
				title: "Global Trade Connect",
				marketPlace: marketplace,
				LoggedInUser: LoggedInUser,
				categories: results.categories,
				unreadCounts: results.unreadCounts,
				bottomCategory: bottomCategory,
				queryURI: queryURI,
				queryURIString: querystring.stringify(queryURI),
				selectedPage: 'performance',
				vendorPlan: vendorPlan,
				dropDownUrl: dropDownUrl,
				cart: results.cartInfo,
				statusCode: statusCode,
				selectedMetrics: selectedMetrics,
				topItems:results.topItems,
				dateRangeOptions:dateRangeOptions
			});
		} else {
			res.render('vendorNav/reporting/performance', err);
		}
	});
}