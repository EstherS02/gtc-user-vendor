'use strict';

const async = require('async');
const config = require('../../../config/environment');
const statusCode = require('../../../config/status');
const marketPlaceType = require('../../../config/marketplace');
const service = require('../../../api/service');
const vendorPlan = require('../../../config/gtc-plan');
const cartService = require('../../../api/cart/cart.service');
const marketplace = require('../../../config/marketplace');
const url = require('url');

export function viewListings(req, res) {

	var offset, limit, field, order, page, type, maxSize;;
	var queryParams = {}, LoggedInUser = {}, bottomCategory = {}, queryURI = {}, queryPaginationObj = {};

	var productModel = "MarketplaceProduct";
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
	}else{
		queryParams['status'] = {
			'$ne': statusCode["DELETED"]
		}
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
		products: function(callback) {

			service.findRows(productModel, queryParams, offset, limit, field, order)
				.then(function(products) {
					return callback(null, products);

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
	}, function(err, results) {
		
		if (!err) {
			maxSize = results.products.count / limit;
			if (results.products.count % limit)
				maxSize++;

			queryPaginationObj['maxSize'] = maxSize;

			var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
			var dropDownUrl = fullUrl.replace(req.url, '').replace(req.protocol + '://' + req.get('host'), '').replace('/', '').trim();

			res.render('vendorNav/listings/view-listings', {
				title: "Global Trade Connect",
				products: results.products.rows,
				collectionSize: results.products.count,
				categories: results.categories,
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
				dropDownUrl: dropDownUrl,
				queryURI: queryURI,
				queryPaginationObj: queryPaginationObj
			});
		} else {
			res.render('vendorNav/listings/view-listings', err);
		}
	});
}