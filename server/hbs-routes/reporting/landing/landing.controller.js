'use strict';

const config = require('../../../config/environment');
const statusCode = require('../../../config/status');
const service = require('../../../api/service');
const moment = require('moment');
const marketplace = require('../../../config/marketplace');
const cartService = require('../../../api/cart/cart.service');
var async = require('async');
const vendorPlan = require('../../../config/gtc-plan');
const ReportService = require('../../../utilities/reports');
const notifictionService = require('../../../api/notification/notification.service');

export function reporting(req, res) {
	var LoggedInUser = {}, 
		queryURI ={},
		bottomCategory = {},
		orderItemQueryObj = {};
	var lhsBetween = [], rhsBetween = [];
	
	queryURI['compare'] = 'true';
	
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

    if (req.user)
        LoggedInUser = req.user;

	let user_id = LoggedInUser.id;
	
	if (req.query.lhs_from && req.query.lhs_to) {
		lhsBetween.push(moment(req.query.lhs_from).format("YYYY/MM/DD"), moment(req.query.lhs_to).format("YYYY/MM/DD"));
		queryURI['range'] = 7;
	}else{
		lhsBetween.push(moment().subtract(30, 'days').format("YYYY/MM/DD"), moment().subtract(1,'days').format("YYYY/MM/DD"));	
		queryURI['range'] = 4;
	}
	
	if (req.query.rhs_from && req.query.rhs_to) {
		rhsBetween.push(moment(req.query.rhs_from).format("YYYY/MM/DD"), moment(req.query.rhs_to).format("YYYY/MM/DD"));		
	}else{
		rhsBetween.push(moment().subtract(61,'days').format("YYYY/MM/DD"), moment().subtract(31,'days').format("YYYY/MM/DD"));	
	}

	if (req.query.range) {
		queryURI['range'] = req.query.range;
	} 
	
    if (req.user.role == 2)
        orderItemQueryObj.vendor_id = req.user.Vendor.id;

	queryURI['lhs_from'] = moment(lhsBetween[0]).format("MM/DD/YYYY");
	queryURI['lhs_to'] = moment(lhsBetween[1]).format("MM/DD/YYYY");
	queryURI['rhs_from'] = moment(rhsBetween[0]).format("MM/DD/YYYY");
	queryURI['rhs_to'] = moment(rhsBetween[1]).format("MM/DD/YYYY");

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

			service.findAllRows('Category', includeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
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
				console.log('err', err);
				return callback(err);
			});
		},
		topMarketPlace: function(callback) {
			ReportService.topPerformingMarketPlaces(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
				return callback(null, results);
			}).catch((err) => {
				console.log('err', err);
				return callback(err);
			});
		},
		revenueChanges: function(callback) {
			ReportService.revenueChanges(orderItemQueryObj, lhsBetween, rhsBetween).then((results) => {
				console.log("==============Resultsssssssss=======================", results);
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
		},
		unreadCounts: function(callback) {
			notifictionService.notificationCounts(LoggedInUser.id)
				.then(function(counts) {
					return callback(null, counts);
				}).catch(function(error) {
					return callback(null);
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
				marketPlace: marketplace,
				LoggedInUser: LoggedInUser,
				categories: results.categories,
				bottomCategory: bottomCategory,
				selectedPage: 'reporting',
				vendorPlan: vendorPlan,
				dropDownUrl: dropDownUrl,
				queryURI: queryURI,
				cart: results.cartInfo,
				topProducts: results.topProducts,
				topMarketPlace: results.topMarketPlace,
				revenueChanges: results.revenueChanges,
				revenueCounts: results.revenueCounts,
				unreadCounts: results.unreadCounts,
				statusCode: statusCode,
				dateRangeOptions:dateRangeOptions
			});
		} else {
			res.render('vendorNav/reporting/reporting', err);
		}
	});
}