'use strict';

var async = require('async');
const moment = require('moment');
const sequelize = require('sequelize');
const querystring = require('querystring');
const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const statusCode = require('../../../config/status');
const service = require('../../../api/service');
const reportsService = require('../../../api/reports/reports.service');
const marketPlace = require('../../../config/marketplace');
const orderStatus = require('../../../config/order_status');
const vendorPlan = require('../../../config/gtc-plan');
const cartService = require('../../../api/cart/cart.service');
const marketplace = require('../../../config/marketplace');
const notifictionService = require('../../../api/notification/notification.service');

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

	if (queryParams['range'] == 4) {
		queryParams['start_date'] = moment().subtract(30, 'days').format('MM/DD/YYYY');
		queryParams['end_date'] = moment().subtract(1, 'days').format('MM/DD/YYYY');
	} else {
		if (req.query.start_date) {
			queryParams['start_date'] = req.query.start_date;
		}
		if (req.query.end_date) {
			queryParams['end_date'] = req.query.end_date;
		}
	}

	async.series({
		cartInfo: function(callback) {
			cartService.cartCalculation(LoggedInUser.id, req, res)
				.then((cartResult) => {
					return callback(null, cartResult);
				}).catch((error) => {
					return callback(error);
				});
		},
		accountingReports: function(callback) {
			var accountingQueryParams = {};
			accountingQueryParams['start_date'] = new Date(queryParams['start_date']);
			accountingQueryParams['end_date'] = new Date(queryParams['end_date']);
			reportsService.AccountingReport(req.user.Vendor.id, accountingQueryParams)
				.then((response) => {
					return callback(null, response);
				})
				.catch((error) => {
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
		},
		unreadCounts: function(callback) {
			notifictionService.notificationCounts(LoggedInUser.id)
				.then(function(counts) {
					return callback(null, counts);
				}).catch(function(error) {
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
				unreadCounts: results.unreadCounts,
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
				dateRangeOptions: dateRangeOptions,
				accountingReport: results.accountingReports
			});
		} else {
			return res.render('vendorNav/reporting/accounting', error);
		}
	});
}

export function revenue(req, res) {
	var LoggedInUser = req.user;
	async.series({
		cartInfo: function(callback) {
			cartService.cartCalculation(LoggedInUser.id, req, res)
				.then((cartResult) => {
					return callback(null, cartResult);
				}).catch((error) => {
					return callback(error);
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
		vendorRevenue: function(callback) {
			req.query.vendorID=req.user.Vendor.id;
			reportsService.adFeaturedRevenue(req, res)
				.then((response) => {
					return callback(null, response);
				})
				.catch((error) => {
					console.log("error--------------------", error)
					return callback(null);
				});
		}
	}, function(error, results) {
		if (!error) {
			return res.render('vendorNav/reporting/revenue', {
				title: "Global Trade Connect",
				selectedPage: 'revenue',
				LoggedInUser: LoggedInUser,
				vendorPlan: vendorPlan,
				cart: results.cartInfo,
				unreadCounts: results.unreadCounts,
				vendorRevenue:results.vendorRevenue
			});
		}
	})
}

export function processing(req, res) {
	var LoggedInUser = req.user;
	async.series({
		cartInfo: function(callback) {
			cartService.cartCalculation(LoggedInUser.id, req, res)
				.then((cartResult) => {
					return callback(null, cartResult);
				}).catch((error) => {
					return callback(error);
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
	}, function(error, results) {
		if (!error) {
			return res.render('vendorNav/reporting/processing', {
				title: "Global Trade Connect",
				selectedPage: 'processing',
				LoggedInUser: LoggedInUser,
				vendorPlan: vendorPlan,
				cart: results.cartInfo,
				unreadCounts: results.unreadCounts
			});
		}
	})
}

export function subscription(req, res) {
	var LoggedInUser = req.user;
	async.series({
		cartInfo: function(callback) {
			cartService.cartCalculation(LoggedInUser.id, req, res)
				.then((cartResult) => {
					return callback(null, cartResult);
				}).catch((error) => {
					return callback(error);
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
	}, function(error, results) {
		if (!error) {
			return res.render('vendorNav/reporting/subscription', {
				title: "Global Trade Connect",
				selectedPage: 'subscription',
				LoggedInUser: LoggedInUser,
				vendorPlan: vendorPlan,
				cart: results.cartInfo,
				unreadCounts: results.unreadCounts
			});
		}
	})
}

export function gtcpay(req, res) {
	var LoggedInUser = req.user;
	async.series({
		cartInfo: function(callback) {
			cartService.cartCalculation(LoggedInUser.id, req, res)
				.then((cartResult) => {
					return callback(null, cartResult);
				}).catch((error) => {
					return callback(error);
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
	}, function(error, results) {
		if (!error) {
			return res.render('vendorNav/reporting/gtcpay', {
				title: "Global Trade Connect",
				selectedPage: 'gtcpay',
				LoggedInUser: LoggedInUser,
				vendorPlan: vendorPlan,
				cart: results.cartInfo,
				unreadCounts: results.unreadCounts
			});
		}
	})
}

export function membership(req, res) {
	var LoggedInUser = req.user;
	async.series({
		cartInfo: function(callback) {
			cartService.cartCalculation(LoggedInUser.id, req, res)
				.then((cartResult) => {
					return callback(null, cartResult);
				}).catch((error) => {
					return callback(error);
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
	}, function(error, results) {
		if (!error) {
			return res.render('vendorNav/reporting/membership', {
				title: "Global Trade Connect",
				selectedPage: 'membership',
				LoggedInUser: LoggedInUser,
				vendorPlan: vendorPlan,
				cart: results.cartInfo,
				unreadCounts: results.unreadCounts
			});
		}
	})
}