'use strict';

const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const reference = require('../../../config/model-reference');
const statusCode = require('../../../config/status');
const service = require('../../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');
const _ = require('lodash');
const marketPlace = require('../../../config/marketplace');
const orderStatus = require('../../../config/order_status');
var async = require('async');
const vendorPlan = require('../../../config/gtc-plan');
const ReportService = require('../../../utilities/reports');

export function reporting(req, res) {
	console.log('reporting req query', req.query);
	var LoggedInUser = {};
	var queryURI = {};
	var bottomCategory = {};
	var categoryModel = "Category";
	var lhsBetween = [];
	var rhsBetween = [];
	queryURI['compare'] = 'true';

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

	let orderItemQueryObj = {};
	if (req.user.role == 2)
		orderItemQueryObj.vendor_id = req.user.Vendor.id;

	/*if (req.query.compare) {
		orderItemQueryObj.compare = req.query.compare;
		queryURI['compare'] = req.query.compare;
	}*/

	queryURI['rep_from'] = lhsBetween[0];
	queryURI['rep_to'] = lhsBetween[1];
	queryURI['com_from'] = rhsBetween[0];
	queryURI['com_to'] = rhsBetween[1];

	async.series({
			cartCounts: function(callback) {
				service.cartHeader(LoggedInUser).then(function(response) {
					return callback(null, response);
				}).catch(function(error) {
					console.log('cartCounts Error :::', error);
					return callback(null);
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
			},
			topProducts: function(callback) {
				ReportService.topPerformingProducts(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
					return callback(null, results);
				}).catch((err) => {
					console.log('topProducts err', err);
					return callback(err);
				});
			},
			topMarketPlace: function(callback) {
				ReportService.topPerformingMarketPlaces(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
					return callback(null, results);
				}).catch((err) => {
					console.log('topMarketPlace err', err);
					return callback(err);
				});
			},
			revenueChanges: function(callback) {
				ReportService.revenueChanges(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
					return callback(null, results);
				}).catch((err) => {
					console.log('revenueChanges err', err);
					return callback(err);
				});
			},
			revenueCounts: function(callback) {
				ReportService.revenueChangesCounts(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
					return callback(null, results);
				}).catch((err) => {
					console.log('revenueCounts err', err);
					return callback(err);
				});
			}
		},
		function(err, results) {
			var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
			var dropDownUrl = fullUrl.replace(req.protocol + '://' + req.get('host'), '').replace('/', '');
			if (!err) {
				res.render('vendorNav/reporting/reporting', {
					title: "Global Trade Connect",
					products: results.products,
					marketPlace: marketPlace,
					LoggedInUser: LoggedInUser,
					categories: results.categories,
					bottomCategory: bottomCategory,
					selectedPage: 'reporting',
					vendorPlan: vendorPlan,
					dropDownUrl: dropDownUrl,
					queryURI: queryURI,
					cartheader: results.cartCounts,
					topProducts: results.topProducts,
					topMarketPlace: results.topMarketPlace,
					revenueChanges: results.revenueChanges,
					revenueCounts: results.revenueCounts
				});
			} else {
				res.render('vendorNav/reporting/reporting', err);
			}
		});
}