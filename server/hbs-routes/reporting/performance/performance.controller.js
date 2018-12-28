'use strict';

const querystring = require('querystring');
const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const statusCode = require('../../../config/status');
const service = require('../../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');
const marketplace = require('../../../config/marketplace');
const cartService = require('../../../api/cart/cart.service');
const orderStatus = require('../../../config/order_status');
const async = require('async');
const vendorPlan = require('../../../config/gtc-plan');
const ReportService = require('../../../utilities/reports');
const notifictionService = require('../../../api/notification/notification.service');

export function performance(req, res) {
	var offset, limit, field, order;
	var queryObj = {};
	var LoggedInUser = {};
	var bottomCategory = {};
	var categoryModel = "Category";
	var lhsBetween = [];
	var rhsBetween = [];
	var queryURI = {};

	var selectedTopCatogory;

	selectedTopCatogory = req.query.top ? req.query.top : "products";
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;
	field = 'id';
	order = 'asc';
	// var productModel = "MarketplaceProduct";

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;

	if (req.query.lhs_from && req.query.lhs_to) {
		lhsBetween.push(moment(req.query.lhs_from).format("MM/DD/YYYY"), moment(req.query.lhs_to).format("MM/DD/YYYY"))
	} else {
		lhsBetween.push(moment().subtract(30, 'days').format("MM/DD/YYYY"), moment().format("MM/DD/YYYY"));
	}
	if (req.query.rhs_from && req.query.rhs_to) {
		rhsBetween.push(moment(req.query.rhs_from).format("MM/DD/YYYY"), moment(req.query.rhs_to).format("MM/DD/YYYY"));
	} else {
		rhsBetween.push(moment().subtract(30, 'days').format("MM/DD/YYYY"), moment().format("MM/DD/YYYY"));
	}

	queryURI['offset'] = offset;
	queryURI['limit'] = limit;
	queryURI['lhs_from'] = lhsBetween[0];
	queryURI['lhs_to'] = lhsBetween[1];
	queryURI['rhs_from'] = rhsBetween[0];
	queryURI['rhs_to'] = rhsBetween[1];
	queryURI['compare'] = 'true';
	queryURI['top'] = selectedTopCatogory;


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
		/*products: function(callback) {
				queryObj['vendor_id'] = LoggedInUser.Vendor.id;
				service.findRows(productModel, queryObj, offset, limit, field, order)
					.then(function(products) {
						return callback(null, products.rows);

					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(null);
					});
			},*/
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
		// performance: function(callback) {
		// 	let performanceQueryObj = {};
		// 	if (req.user.role == 2)
		// 		performanceQueryObj.vendor_id = req.user.Vendor.id;

		// 	if (req.query.compare) {
		// 		performanceQueryObj.compare = req.query.compare;
		// 		queryURI['compare'] = req.query.compare;
		// 	}

		// 	ReportService.performanceChanges(performanceQueryObj, lhsBetween, rhsBetween, limit, offset).then((results) => {
		// 		return callback(null, results);
		// 	}).catch((err) => {
		// 		console.log('performance err', err);
		// 		return callback(err);
		// 	});
		// },
		unreadCounts: function(callback) {
			notifictionService.notificationCounts(LoggedInUser.id)
				.then(function(counts) {
					return callback(null, counts);
				}).catch(function(error) {
					return callback(null);
				});
		},
		topCategory: function(callback) {
			let performanceQueryObj = {};
			if (req.user.role == 2)
				performanceQueryObj.vendor_id = req.user.Vendor.id;

			if (req.query.top == "products") {
				ReportService.performanceChanges(performanceQueryObj, lhsBetween, rhsBetween, limit, offset)
					.then(function(results) {
						return callback(null, results);
					}).catch(function(error) {
						return callback(error);
					});
			} else if (req.query.top == "marketplace") {
				ReportService.marketplacePerformanceChanges(performanceQueryObj, lhsBetween, rhsBetween, limit, offset)
					.then(function(results) {
						return callback(null, results);
					}).catch(function(error) {
						return callback(error);
					});
			} else if (req.query.top == "city") {
				ReportService.cityPerformanceChanges(performanceQueryObj, lhsBetween, rhsBetween, limit, offset)
					.then(function(results) {
						return callback(null, results);
					}).catch(function(error) {
						return callback(error);
					});
			} else {
				ReportService.performanceChanges(performanceQueryObj, lhsBetween, rhsBetween, limit, offset)
					.then(function(results) {
						return callback(null, results);
					}).catch(function(error) {
						return callback(null);
					});
			}
		}
	},
		function(err, results) {
			var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
			var dropDownUrl = fullUrl.replace(req.url, '').replace(req.protocol + '://' + req.get('host'), '').replace('/', '');
			if (!err) {
				res.render('vendorNav/reporting/performance', {
					title: "Global Trade Connect",
					//products: results.products,
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
					performance: results.performance,
					statusCode: statusCode,
					selectedTopCatogory: selectedTopCatogory,
					topCategory:results.topCategory
				});
			} else {
				res.render('vendorNav/reporting/performance', err);
			}
		});
}