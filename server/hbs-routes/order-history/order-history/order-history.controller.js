'use strict';

const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const reference = require('../../../config/model-reference');
const statusCode = require('../../../config/status');
const service = require('../../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');
const marketPlace = require('../../../config/marketplace');
const orderStatus = require('../../../config/order_status');
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
	var orderItemQueryObj = {};
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
			start_date = moment();
		} else if (dateSelect == "yesterday") {
			start_date = moment().add(-1, 'd').toDate();
		} else if (dateSelect == "last7day") {
			start_date = moment().add(-7, 'd').toDate();
		} else if (dateSelect == "last15day") {
			start_date = moment().add(-15, 'd').toDate();
		} else if (dateSelect == "last30day") {
			start_date = moment().add(-30, 'd').toDate();
		} else {
			if (from_date) {
				start_date = from_date;
			} else {
				start_date = moment().add(-70, 'd').toDate("yyyy-mm-dd");
			}
			if (to_date) {
				end_date = to_date;
			} else {
				end_date = moment().add(0, 'd').toDate("yyyy-mm-dd");
			}
		}
	} else {
		if (from_date) {
			start_date = from_date;
		} else {
			start_date = moment().add(-70, 'd').toDate("yyyy-mm-dd");
		}
		if (to_date) {
			end_date = to_date;
		} else {
			end_date = moment().add(0, 'd').toDate("yyyy-mm-dd");
		}
		orderQueryObj['ordered_date'] = {
			$between: [start_date, end_date]
		};
	}

	orderQueryObj['ordered_date'] = {
		$between: [start_date, end_date]
	};
	queryURI['start_date'] = start_date;
	queryURI['end_date'] = end_date;


	if (marketType) {
		queryURI['marketType'] = marketType;
		productQueryObj['marketplace_id'] = marketType;
	}
	if (status) {
		queryURI['status'] = status;
		orderQueryObj['order_status'] = orderStatus[status];
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
		productQueryObj['product_name'] = {
			like: '%' + req.query.keyword + '%'
		};
	}
	var field = "id";
	offset = (page - 1) * limit;
	queryPaginationObj['offset'] = offset;
	var maxSize;

	var modelName = "Order";
	orderQueryObj['user_id'] = user_id;
	// var includeArr = [{
	// 	model: model["Orderitem"],
	// 	where: orderItemQueryObj,
	// }, {
	// 	model: model['Product'],
	// 	where: productQueryObj,
	// 	include: [{
	// 		model: model['Vendor'],
	// 	}]

	// }];
	var includeArr=[];
	var queryObjCategory = {
		status: statusCode['ACTIVE']
	};
	async.series({
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
		orderHistory: function(callback) {
			service.findRows(modelName,orderQueryObj, offset, limit, field, order, includeArr)
				.then(function(results) {
					return callback(null, results);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},

	}, function(err, results) {
		// console.log("results*****************************************",JSON.stringify(results.orderHistory.rows))
		maxSize = results.orderHistory.count / limit;
		if (results.orderHistory.count % limit)
			maxSize++;
		queryPaginationObj['maxSize'] = maxSize;
		console.log("start_date", queryPaginationObj, queryURI);

		var total_transaction = 0.00;
		if (results.orderHistory.count > 0) {
			results.orderHistory.rows.forEach((value, index) => {
				total_transaction += parseFloat(value.total_price);
				results.orderHistory.rows[index]['final_price'] = (parseFloat(value.total_price)).toFixed(2);
			});
		}
		if (!err) {
			res.render('userNav/order-history', {
				title: "Global Trade Connect",
				categories: results.categories,
				bottomCategory: bottomCategory,
				OrderItems: results.orderHistory.rows,
				count: results.orderHistory.count,
				queryURI: queryURI,
				LoggedInUser: LoggedInUser,
				marketPlace: marketPlace,
				statusCode: statusCode,
				orderStatus: orderStatus,
				totalTransaction: (total_transaction).toFixed(2),
				page: page,
				maxSize: maxSize,
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