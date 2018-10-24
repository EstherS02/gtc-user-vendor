'use strict';

const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const statusCode = require('../../../config/status');
const service = require('../../../api/service');
const moment = require('moment');
const marketplace = require('../../../config/marketplace');
const cartService = require('../../../api/cart/cart.service');
const orderStatusCode = require('../../../config/order_status');
const async = require('async');
const vendorPlan = require('../../../config/gtc-plan');

export function orderHistory(req, res) {
	var LoggedInUser = {};
	var bottomCategory = {};
	var categoryModel = "Category";
	if (req.user)
		LoggedInUser = req.user;
	let user_id = LoggedInUser.id;


	var queryURI = {};
	var queryPaginationObj = {};
	var orderQueryObj = {};
	var productQueryObj = {};

	var from_date = req.query.from_date;
	var to_date = req.query.to_date;
	var dateSelect = req.query.dateSelect;
	var marketType = req.query.marketType;
	var status = req.query.status;
	var start_date;
	var end_date;
	if (dateSelect) {
		queryURI['dateSelect'] = dateSelect;
		end_date = moment().add(0, 'd').toDate();
		if (dateSelect == "today") {
			//start_date = moment();
			var convertMoment = moment();
			start_date = new Date(convertMoment);

		} else if (dateSelect == "yesterday") {
			start_date = moment().add(-1, 'd').toDate();
			end_date = start_date;
		} else if (dateSelect == "last7day") {
			start_date = moment().add(-7, 'd').toDate();
		} else if (dateSelect == "last15day") {
			start_date = moment().add(-15, 'd').toDate();
		} else if (dateSelect == "last30day") {
			start_date = moment().add(-30, 'd').toDate();
		} else {}
	}
	if (dateSelect) {
		orderQueryObj['ordered_date'] = {
			$between: [start_date, end_date]
		};
		queryURI['start_date'] = start_date;
		if (from_date && to_date) {
			queryURI['end_date'] = end_date;
		}
	}


	if (marketType) {
		queryURI['marketType'] = marketType;
		productQueryObj['marketplace_id'] = marketType;
	}
	if (status) {
		queryURI['status'] = status;
		orderQueryObj['order_status'] = orderStatusCode[status];
	}


	var order = "desc";
	var offset = 0;
	var limit = 1;
	var page;
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
	if (req.query.keyword) {
		queryPaginationObj.keyword = req.query.keyword;
		queryURI['keyword'] = req.query.keyword;
		orderQueryObj['id'] = {
			like: '%' + req.query.keyword + '%'
		};
	}
	var field = "id";
	offset = (page - 1) * limit;
	queryPaginationObj['offset'] = offset;
	var maxSize;

	var modelName = "Order";
	orderQueryObj['user_id'] = user_id;
	var orderIncludeArr = [{
		model: model["OrderItem"],
		include: [{
			model: model['Product'],
			include: [{
				model: model['Vendor'],
				attributes: ['id', 'vendor_name']
			}],
			attributes: ['id', 'vendor_id']
		}],
		attributes: ['id', 'product_id']
	}];
	var queryObjCategory = {
		status: statusCode['ACTIVE']
	};
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
		orderHistory: function(callback) {

			service.findAllRows(modelName, orderIncludeArr, orderQueryObj, offset, limit, field, order)
				.then(function(results) {
					return callback(null, results);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},

	}, function(err, results) {
		// maxSize = results.orderHistory.count / limit;
		// if (results.orderHistory.count % limit)
		// 	maxSize++;
		queryPaginationObj['maxSize'] = 5;
		console.log("start_date", queryPaginationObj, queryURI);

		var total_transaction = 0.00;
		if (results.orderHistory.count > 0) {
			results.orderHistory.rows.forEach((value, index) => {
				total_transaction += parseFloat(value.total_price);
				results.orderHistory.rows[index]['final_price'] = ((value.total_price) > 0) ? (parseFloat(value.total_price)).toFixed(2) : 0;
			});
		}
		if (!err) {
			res.render('userNav/order-history', {
				title: "Global Trade Connect",
				categories: results.categories,
				bottomCategory: bottomCategory,
				Order: results.orderHistory.rows,
				count: results.orderHistory.count,
				queryURI: queryURI,
				LoggedInUser: LoggedInUser,
				marketPlace: marketplace,
				statusCode: statusCode,
				cart: results.cartInfo,
				orderStatusCode: orderStatusCode,
				totalTransaction: (total_transaction).toFixed(2),
				page: page,
				pageSize: limit,
				queryPaginationObj: queryPaginationObj,
				collectionSize: results.orderHistory.count,
				selectedPage: "order-history",
				vendorPlan: vendorPlan
			});
		} else {
			res.render('userNav/order-history', err);
		}
	});
}