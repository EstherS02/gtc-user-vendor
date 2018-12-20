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
	var queryPaginationObj = {};
	var offset, limit, order, page;
	var queryURI = {};
	var originalUrl = req.originalUrl.split('?')[0];

	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	queryPaginationObj['offset'] = offset;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;
	queryPaginationObj['limit'] = limit;
	queryURI['limit'] = limit;
	delete req.query.limit;
	order = req.query.order ? req.query.order : "desc";
	queryPaginationObj['order'] = order;
	delete req.query.order;
	page = req.query.page ? parseInt(req.query.page) : 1;
	queryPaginationObj['page'] = page;
	queryURI['page'] = page;
	delete req.query.page;

	offset = (page - 1) * limit;
	queryPaginationObj['offset'] = offset;

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
			req.query.vendorID = req.user.Vendor.id;
			req.query.limit=limit;
			req.query.offset=offset;
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
		queryPaginationObj['maxSize'] = 5;
		if (!error) {
			return res.render('vendorNav/reporting/viewfullreport', {
				title: "Global Trade Connect",
				selectedPage: 'revenue',
				LoggedInUser: LoggedInUser,
				vendorPlan: vendorPlan,
				cart: results.cartInfo,
				unreadCounts: results.unreadCounts,
				vendorRevenue: results.vendorRevenue,
				queryPaginationObj: queryPaginationObj,
				queryURI: queryURI,
				queryParamsString: querystring.stringify(queryURI),
				originalUrl:originalUrl
			});
		}
	})
}

export function processing(req, res) {
	var queryPaginationObj = {};
	var offset, limit, order, page;
	var queryURI = {};
	var originalUrl = req.originalUrl.split('?')[0];

	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	queryPaginationObj['offset'] = offset;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;
	queryPaginationObj['limit'] = limit;
	queryURI['limit'] = limit;
	delete req.query.limit;
	order = req.query.order ? req.query.order : "desc";
	queryPaginationObj['order'] = order;
	delete req.query.order;
	page = req.query.page ? parseInt(req.query.page) : 1;
	queryPaginationObj['page'] = page;
	queryURI['page'] = page;
	delete req.query.page;

	offset = (page - 1) * limit;
	queryPaginationObj['offset'] = offset;

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
					return callback(error);
				});
		},
		processingFee: function(callback) {
			console.log("---------------------------------------------------processingFee----------------------------------------------------------");
			var offset, limit, field, order;
			var queryObj = {};
			var OrderVendorModelName = 'OrderVendor'
			queryObj['vendor_id'] = req.user.Vendor.id;

			let includeArr = [{
				model: model['Vendor'],
			}]

			field = req.query.field ? req.query.field : "id";
			delete req.query.field;
			order = req.query.order ? req.query.order : "asc";
			delete req.query.order;

			service.findRows(OrderVendorModelName, queryObj, offset, limit, field, order, includeArr)
				.then(function(rows) {
					return callback(null, rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(error);
				});
		},
	}, function(error, results) {
		queryPaginationObj['maxSize'] = 5;
		if (!error) {
			return res.render('vendorNav/reporting/viewfullreport', {
				title: "Global Trade Connect",
				selectedPage: 'processing',
				LoggedInUser: LoggedInUser,
				vendorPlan: vendorPlan,
				cart: results.cartInfo,
				unreadCounts: results.unreadCounts,
				processingFee: results.processingFee,
				queryPaginationObj: queryPaginationObj,
				queryURI: queryURI,
				queryParamsString: querystring.stringify(queryURI),
				originalUrl:originalUrl
			});
		}
	})
}

export function subscription(req, res) {
	var queryPaginationObj = {};
	var offset, limit, order, page;
	var queryURI = {};
	var originalUrl = req.originalUrl.split('?')[0];

	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	queryPaginationObj['offset'] = offset;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;
	queryPaginationObj['limit'] = limit;
	queryURI['limit'] = limit;
	delete req.query.limit;
	order = req.query.order ? req.query.order : "desc";
	queryPaginationObj['order'] = order;
	delete req.query.order;
	page = req.query.page ? parseInt(req.query.page) : 1;
	queryPaginationObj['page'] = page;
	queryURI['page'] = page;
	delete req.query.page;

	offset = (page - 1) * limit;
	queryPaginationObj['offset'] = offset;

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
		subscriptionFee: function(callback) {
			console.log("---------------------------------------------------subscriptionFee----------------------------------------------------------");
			var offset, limit, field, order;
			var queryObj = {};
			var OrderVendorModelName = 'OrderVendor'
			queryObj['vendor_id'] = req.user.Vendor.id;

			let includeArr = [{
				model: model['Vendor'],
			}]

			field = req.query.field ? req.query.field : "id";
			delete req.query.field;
			order = req.query.order ? req.query.order : "asc";
			delete req.query.order;

			service.findRows(OrderVendorModelName, queryObj, offset, limit, field, order, includeArr)
				.then(function(rows) {
					return callback(null, rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(error);
				});
		}
	}, function(error, results) {
		queryPaginationObj['maxSize'] = 5;
		if (!error) {
			return res.render('vendorNav/reporting/viewfullreport', {
				title: "Global Trade Connect",
				selectedPage: 'subscription',
				LoggedInUser: LoggedInUser,
				vendorPlan: vendorPlan,
				cart: results.cartInfo,
				unreadCounts: results.unreadCounts,
				subscriptionFee: results.subscriptionFee,
				queryPaginationObj: queryPaginationObj,
				queryURI: queryURI,
				queryParamsString: querystring.stringify(queryURI),
				originalUrl:originalUrl
			});
		}
	})
}

export function gtcpay(req, res) {
	var queryPaginationObj = {};
	var offset, limit, order, page;
	var queryURI = {};
	var originalUrl = req.originalUrl.split('?')[0];

offset = req.query.offset ? parseInt(req.query.offset) : 0;
	queryPaginationObj['offset'] = offset;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;
	queryPaginationObj['limit'] = limit;
	queryURI['limit'] = limit;
	delete req.query.limit;
	order = req.query.order ? req.query.order : "desc";
	queryPaginationObj['order'] = order;
	delete req.query.order;
	page = req.query.page ? parseInt(req.query.page) : 1;
	queryPaginationObj['page'] = page;
	queryURI['page'] = page;
	delete req.query.page;

	offset = (page - 1) * limit;
	queryPaginationObj['offset'] = offset;

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
		gtcPayFee: function(callback) {
			console.log("---------------------------------------------------gtcPayFee----------------------------------------------------------");
			var offset, limit, field, order;
			var queryObj = {};
			var OrderVendorModelName = 'OrderVendor'
			queryObj['vendor_id'] = req.user.Vendor.id;

			let includeArr=[{
				model: model['Vendor']
			},{
				model:model['OrderVendorPayout']
			},{
				model:model['Payment']
			}]

			field = req.query.field ? req.query.field : "id";
			delete req.query.field;
			order = req.query.order ? req.query.order : "asc";
			delete req.query.order;

			service.findRows(OrderVendorModelName, queryObj, offset, limit, field, order, includeArr)
				.then(function(rows) {
					return callback(null, rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(error);
				});
		}
	}, function(error, results) {
		queryPaginationObj['maxSize'] = 5;
		if (!error) {
			return res.render('vendorNav/reporting/viewfullreport', {
				title: "Global Trade Connect",
				selectedPage: 'gtcpay',
				LoggedInUser: LoggedInUser,
				vendorPlan: vendorPlan,
				cart: results.cartInfo,
				unreadCounts: results.unreadCounts,
				gtcPayFee:results.gtcPayFee,
				queryPaginationObj: queryPaginationObj,
				queryURI: queryURI,
				queryParamsString: querystring.stringify(queryURI),
				originalUrl:originalUrl
			});
		}
	})
}

export function membership(req, res) {
	var queryPaginationObj = {};
	var offset, limit, order, page;
	var queryURI = {};
	var originalUrl = req.originalUrl.split('?')[0];

	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	queryPaginationObj['offset'] = offset;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;
	queryPaginationObj['limit'] = limit;
	queryURI['limit'] = limit;
	delete req.query.limit;
	order = req.query.order ? req.query.order : "desc";
	queryPaginationObj['order'] = order;
	delete req.query.order;
	page = req.query.page ? parseInt(req.query.page) : 1;
	queryPaginationObj['page'] = page;
	queryURI['page'] = page;
	delete req.query.page;

	offset = (page - 1) * limit;
	queryPaginationObj['offset'] = offset;

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
		membershipDetails: function(callback) {
			var queryParams = {};
			var field = "id";
			var order = "desc";
			var offset = 0;
			var limit = null;
			var limit = req.query.limit ? parseInt(req.query.limit) : 10;
			var offset = req.query.offset ? parseInt(req.query.offset) : 0;
			var page = req.query.page ? parseInt(req.query.page) : 1;

			queryParams['page'] = page;
			queryParams['limit'] = limit;
			offset = (page - 1) * limit;
			var includeArr = [{
				model: model['Payment'],
				attributes: ['id', 'amount', 'date', 'created_on'],
				where: {
					id: {
						$ne: null

					}
				},
				
			}]
			var queryObj = {
				vendor_id: LoggedInUser.Vendor.id,
				payment_id: {
					$ne: null

				}
			}

			service.findAllRows('VendorPlan', includeArr, queryObj, offset, limit, field, order).
				then(function(membershipDetails) {
					var membershipDetails = membershipDetails;
					return callback(null, membershipDetails);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		}
	}, function(error, results) {
		queryPaginationObj['maxSize'] = 5;
		if (!error) {
			return res.render('vendorNav/reporting/viewfullreport', {
				title: "Global Trade Connect",
				selectedPage: 'membership',
				LoggedInUser: LoggedInUser,
				vendorPlan: vendorPlan,
				membershipDetails: results.membershipDetails,
				cart: results.cartInfo,
				unreadCounts: results.unreadCounts,
				queryPaginationObj: queryPaginationObj,
				queryURI: queryURI,
				queryParamsString: querystring.stringify(queryURI),
				originalUrl:originalUrl
			});
		}
	})
}