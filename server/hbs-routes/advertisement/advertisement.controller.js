'use strict';

const async = require('async');
const service = require('../../api/service');
const cartService = require('../../api/cart/cart.service');
const status = require('../../config/status');
const marketplace = require('../../config/marketplace');
const model = require('../../sqldb/model-connect');
const vendorPlan = require('../../config/gtc-plan');

export function adList(req, res) {

	var LoggedInUser = {}, bottomCategory = {}, queryObj = {}, queryURI = {}, queryPaginationObj = {};
	var offset, limit, order, page, field, user_id;
	var includeArrAds = [];

	if (req.user)
		LoggedInUser = req.user;

	includeArrAds = [
		{ model: model['Country'] }, 
		{ model: model['State']}
	];

	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	queryPaginationObj['offset'] = offset;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;
	queryPaginationObj['limit'] = limit;
	delete req.query.limit;
	order = req.query.order ? req.query.order : "desc";
	queryPaginationObj['order'] = order;
	delete req.query.order;
	page = req.query.page ? parseInt(req.query.page) : 1;
	queryPaginationObj['page'] = page;
	delete req.query.page;
	field = req.query.field ? parseInt(req.query.field) : 'created_on';
	queryPaginationObj['field'] = field;
	delete req.query.page;

	if (req.query.status) {
		queryURI['status'] = req.query.status;
		queryObj['status'] = status[req.query.status]
	}
	if (req.query.keyword) {
		queryURI['keyword'] = req.query.keyword;
		queryObj['product_name'] = {
			like: '%' + req.query.keyword + '%'
		};
	}

	queryObj['vendor_id'] = LoggedInUser.Vendor.id;

	user_id = LoggedInUser.id;

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
			var categoryOffset, categoryLimit, categoryField, categoryOrder;
			var categoryQueryObj = {};

			categoryOffset = 0;
			categoryLimit = null;
			categoryField = "id";
			categoryOrder = "asc";
			
			categoryQueryObj['status'] = status["ACTIVE"];

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
		ads: function(callback) {
			service.findAllRows('ProductAdsSetting', includeArrAds, queryObj, offset, limit, field, 'desc')
				.then(function(response) {
					console.log(response);
					return callback(null, response);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
	}, function(err, results) {
		if (!err) {
			res.render('vendorNav/advertisement/ad-list', {
				title: "Global Trade Connect",
				LoggedInUser: LoggedInUser,
				categories: results.categories,
				ads: results.ads,
				status: status,
				queryPaginationObj: queryPaginationObj,
				bottomCategory: bottomCategory,
				cart: results.cartInfo,
				marketPlace: marketplace,
				selectedPage: 'ad-form',
				vendorPlan: vendorPlan,
			});
		} else {
			res.render('vendorNav/ad-form', err);
		}
	});
}

export function adForm(req, res) {

	var LoggedInUser = {}, bottomCategory = {}, queryObj = {}, queryObjAds = {};
	var user_id;
	var includeArrAds = [];

	if (req.user)
		LoggedInUser = req.user;

	user_id = LoggedInUser.id;

	includeArrAds = [
		{ model: model['Country'] },
		{ model: model['State']	}
	];

	if (req.params.id) {
		queryObjAds['id'] = req.params.id;
	} else {
		queryObjAds['id'] = '';
	}

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
			var categoryOffset, categoryLimit, categoryField, categoryOrder;
			var categoryQueryObj = {};

			categoryOffset = 0;
			categoryLimit = null;
			categoryField = "id";
			categoryOrder = "asc";
			
			categoryQueryObj['status'] = status["ACTIVE"];

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
		ads: function(callback) {
			service.findRow('ProductAdsSetting', queryObjAds, includeArrAds)
				.then(function(ad) {
					if (ad) {
						return callback(null, ad);
					} else {
						return callback(null);
					}
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		country: function(callback) {
			const countryField = 'name';
			const countryOrder = 'ASC';
			service.findRows('Country', queryObj, 0, null, countryField, countryOrder)
				.then(function(country) {
					return callback(null, country.rows);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
	}, function(err, results) {
		if (!err) {
			res.render('vendorNav/advertisement/ad-form', {
				title: "Global Trade Connect",
				LoggedInUser: LoggedInUser,
				categories: results.categories,
				bottomCategory: bottomCategory,
				cart: results.cartInfo,
				marketPlace: marketplace,
				country: results.country,
				ads: results.ads,
				status: status,
				selectedPage: 'ad-form',
				vendorPlan: vendorPlan,
			});
		} else {
			res.render('vendorNav/ad-form', err);
		}
	});
}