'use strict';

const async = require('async');
const config = require('../../../config/environment');
const statusCode = require('../../../config/status');
const marketPlaceType = require('../../../config/marketplace');
const service = require('../../../api/service');
const vendorPlan = require('../../../config/gtc-plan');
const cartService = require('../../../api/cart/cart.service');
const productService = require('../../../api/product/product.service');
const marketplace = require('../../../config/marketplace');
const url = require('url');
const notifictionService = require('../../../api/notification/notification.service');

export function viewListings(req, res) {

	var offset, limit, field, order, page, type, maxSize;;
	var queryParams = {},
		LoggedInUser = {},
		bottomCategory = {},
		queryURI = {},
		queryPaginationObj = {};

	var categoryModel = "Category";
	field = "id";
	order = "asc";
	offset = 0;

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
	delete req.query.page;

	offset = (page - 1) * limit;

	if (req.user)
		LoggedInUser = req.user;

	queryParams['vendor_id'] = LoggedInUser.Vendor.id;
	type = req.params.type;

	if (req.params.type == 'wholesale') {
		queryParams["marketplace_id"] = marketPlaceType['WHOLESALE'];
	}
	if (req.params.type == 'shop') {
		queryParams["marketplace_id"] = marketPlaceType['PUBLIC'];
	}
	if (req.params.type == 'services') {
		queryParams["marketplace_id"] = marketPlaceType['SERVICE'];
	}
	if (req.params.type == 'lifestyle') {
		queryParams["marketplace_id"] = marketPlaceType['LIFESTYLE'];
	}
	if (req.query.keyword) {
		queryURI['keyword'] = req.query.keyword;
		queryParams['product_name'] = {
			like: '%' + req.query.keyword + '%'
		};
	}

	if (req.query.status) {
		queryURI['status'] = req.query.status;
		queryParams['status'] = statusCode[req.query.status]
	} else {
		queryParams['status'] = {
			'$ne': statusCode["DELETED"]
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
		products: function(callback) {
			productService.vendorProducts(queryParams, offset, limit, field, order)
				.then(function(products) {
					return callback(null, products);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		categories: function(callback) {
			var includeArr = [];
			var categoryOffset, categoryLimit, categoryField, categoryOrder;
			var categoryQueryObj = {};

			categoryOffset = 0;
			categoryLimit = null;
			categoryField = "id";
			categoryOrder = "asc";

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
			maxSize = results.products.count / limit;
			if (results.products.count % limit)
				maxSize++;

			queryPaginationObj['maxSize'] = maxSize;

			res.render('vendorNav/listings/view-listings', {
				title: "Global Trade Connect",
				products: results.products.rows,
				collectionSize: results.products.count,
				categories: results.categories,
				unreadCounts: results.unreadCounts,
				cart: results.cartInfo,
				marketPlace: marketplace,
				statusCode: statusCode,
				page: page,
				bottomCategory: bottomCategory,
				pageSize: limit,
				offset: offset,
				maxSize: 5,
				LoggedInUser: LoggedInUser,
				type: type,
				selectedPage: type,
				vendorPlan: vendorPlan,
				queryURI: queryURI,
				queryPaginationObj: queryPaginationObj
			});
		} else {
			res.render('vendorNav/listings/view-listings', err);
		}
	});
}