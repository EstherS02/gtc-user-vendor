'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const statusCode = require('../../config/status');
const productService = require('../../api/product/product.service');
const populate = require('../../utilities/populate');
const service = require('../../api/service');
const cartService = require('../../api/cart/cart.service');
const marketplace = require('../../config/marketplace');
const moment = require('moment');
const async = require('async');
const vendorPlan = require('../../config/gtc-plan');
const notifictionService = require('../../api/notification/notification.service');

export function upgradeplan(req, res) {
	var LoggedInUser = {};
	var bottomCategory = {};

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;
	var queryPaginationObj = {};
	if (req.query.sort == 'rating') {
		var field = req.query.sort;
		queryPaginationObj["field"] = field;
	} else {
		var field = 'id';
		queryPaginationObj["field"] = field;
	}

	var order = "desc"; //"asc"
	var offset = 0;
	var limit = 1;
	var vendor_id;
	if (LoggedInUser.Vendor)
		vendor_id = LoggedInUser.Vendor.id;

	var rating_limit = 120;

	//pagination 
	var page;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 5;
	delete req.query.limit;
	order = req.query.order ? req.query.order : "desc";

	delete req.query.order;
	page = req.query.page ? parseInt(req.query.page) : 1;
	delete req.query.page;

	offset = (page - 1) * limit;
	var maxSize;
	// End pagination
	var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
	var dropDownUrl = fullUrl.replace(req.protocol + '://' + req.get('host'), '').replace('/', '');

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
		cards: function(callback) {
			console.log("userss::" + req.user.id);
			var includeArr = [];
			const offset = 0;
			const limit = null;
			const field = "id";
			const order = "asc";
			var queryObjects = {};
			queryObjects.user_id = req.user.id;
			queryObjects.status = statusCode['ACTIVE'];
			service.findAllRows("PaymentSetting", includeArr, queryObjects, offset, limit, field, order)
				.then(function(paymentSetting) {
					var paymentSettings = paymentSetting.rows;
					return callback(null, paymentSettings);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		userplanDetails: function(callback) {
			const currentDate = moment().format('YYYY-MM-DD');
			var includeArr = populate.populateData('Plan');
			var queryObj = {
				user_id: user_id
			}
			var field = "id";
			var order = "desc";
			var limit = 1;
			service.findAllRows('UserPlan', includeArr, queryObj, 0, limit, field, order).
			then(function(userplanDetails) {
				var userplanDetails = userplanDetails;
				return callback(null, userplanDetails);
			}).catch(function(error) {
				console.log('Error :::', error);
				return callback(null);
			});
		},
		userShowplanDetails: function(callback) {
			var includeArr = [];
			const offset = 0;
			const limit = null;
			const field = "id";
			const order = "asc";
			const id = 5;

			service.findAllRows("Plan", includeArr, id, offset, limit, field, order)
				.then(function(planSetting) {
					var planSetting = planSetting.rows;
					return callback(null, planSetting);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		planDetails: function(callback) {
			const currentDate = moment().format('YYYY-MM-DD');
			var includeArr = populate.populateData('Plan');
			var queryObjs = {}
			if (vendor_id) 
				queryObjs.vendor_id = vendor_id;
			var field = "id";
			var order = "desc";
			var limit = 1;
			service.findAllRows('VendorPlan', includeArr, queryObjs, 0, limit, field, order)
				.then(function(planDetails) {
					return callback(null, planDetails);
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
		categories: function(callback) {
			var includeArr = [];
			const categoryOffset = 0;
			const categoryLimit = null;
			const categoryField = "id";
			const categoryOrder = "asc";
			var categoryModel = "Category";
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
	}, function(err, results) {
		if (!err) {
			res.render('vendorNav/upgradeplan', {
				title: "Global Trade Connect",
				userplanDetails: results.userplanDetails,
				PlanDetails: results.planDetails,
				unreadCounts: results.unreadCounts,
				cart: results.cartInfo,
				marketPlace: marketplace,
				carddetails: results.cards,
				LoggedInUser: LoggedInUser,
				vendorPlan: vendorPlan,
				categories: results.categories,
				bottomCategory: bottomCategory,
				selectedPage: 'upgradeplan'
			});
		} else {
			res.render('upgradeplan', err);
		}
	});
}

export function userBulkupgradePlan(req, res) {
	var LoggedInUser = {};
	var bottomCategory = {};

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;
	var queryPaginationObj = {};
	if (req.query.sort == 'rating') {
		var field = req.query.sort;
		queryPaginationObj["field"] = field;
	} else {
		var field = 'id';
		queryPaginationObj["field"] = field;
	}

	var order = "desc";
	var offset = 0;
	var limit = 1;
	var vendor_id;
	if (LoggedInUser.Vendor) 
		vendor_id = LoggedInUser.Vendor.id;
	
	var rating_limit = 120;

	//pagination 
	var page;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 5;
	delete req.query.limit;
	order = req.query.order ? req.query.order : "desc";

	delete req.query.order;
	page = req.query.page ? parseInt(req.query.page) : 1;
	delete req.query.page;

	offset = (page - 1) * limit;
	var maxSize;
	var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
	var dropDownUrl = fullUrl.replace(req.protocol + '://' + req.get('host'), '').replace('/', '');

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
		cards: function(callback) {
			console.log("userss::" + req.user.id);
			var includeArr = [];
			const offset = 0;
			const limit = null;
			const field = "id";
			const order = "asc";
			var queryObjects = {};
			queryObjects.user_id = req.user.id;
			queryObjects.status = statusCode['ACTIVE'];
			service.findAllRows("PaymentSetting", includeArr, queryObjects, offset, limit, field, order)
				.then(function(paymentSetting) {
					var paymentSettings = paymentSetting.rows;

					return callback(null, paymentSettings);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		userplanDetails: function(callback) {
			const currentDate = moment().format('YYYY-MM-DD');
			var includeArr = populate.populateData('Plan');
			var queryObj = {
				user_id: user_id
			}
			var field = "id";
			var order = "desc";
			var limit = 1;
			service.findAllRows('UserPlan', includeArr, queryObj, 0, limit, field, order).
			then(function(userplanDetails) {
				var userplanDetails = userplanDetails;
				return callback(null, userplanDetails);
			}).catch(function(error) {
				console.log('Error :::', error);
				return callback(null);
			});
		},
		userShowplanDetails: function(callback) {
			var includeArr = [];
			const offset = 0;
			const limit = null;
			const field = "id";
			const order = "asc";
			const id = 5;

			service.findAllRows("Plan", includeArr, id, offset, limit, field, order)
				.then(function(planSetting) {
					var planSetting = planSetting.rows;
					return callback(null, planSetting);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		categories: function(callback) {
			var includeArr = [];
			const categoryOffset = 0;
			const categoryLimit = null;
			const categoryField = "id";
			const categoryOrder = "asc";
			var categoryModel = "Category";
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
	}, function(err, results) {
		if (!err) {
			res.render('vendorNav/user-bulkbuyerplan', {
				title: "Global Trade Connect",
				userplanDetails: results.userplanDetails,
				cart: results.cartInfo,
				marketPlace: marketplace,
				carddetails: results.cards,
				LoggedInUser: LoggedInUser,
				vendorPlan: vendorPlan,
				categories: results.categories,
				bottomCategory: bottomCategory,
				unreadCounts: results.unreadCounts,	
				selectedPage: 'user-bulkbuyerplan'
			});
		} else {
			res.render('user-bulkbuyerplan', err);
		}
	});
}