'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const async = require('async');
const marketplace = require('../../config/marketplace');
const cartService = require('../../api/cart/cart.service');
const vendorPlan = require('../../config/gtc-plan');

export function wishlist(req, res) {

	var categoryModel = "Category";
	var bottomCategory = {};
	var LoggedInUser = {};
	var queryURI = {};
	if (req.user)
		LoggedInUser = req.user;
	var queryPaginationObj = {};
	let user_id = LoggedInUser.id;

	var field = 'created_on';
	var order = "desc";
	// var offset = 0;
	var limit, offset, page;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	queryPaginationObj['offset'] = offset;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;
	queryPaginationObj['limit'] = limit;
	queryURI['limit'] = limit;
	delete req.query.limit;
	field = req.query.field ? req.query.field : "id";
	queryPaginationObj['field'] = field;
	delete req.query.field;
	order = req.query.order ? req.query.order : "asc";
	queryPaginationObj['order'] = order;
	delete req.query.order;

	page = req.query.page ? parseInt(req.query.page) : 1;
	queryPaginationObj['page'] = page;
	queryURI['page'] = page;
	delete req.query.page;

	offset = (page - 1) * limit;
	queryPaginationObj['offset'] = offset;
	// var field = "id";
	offset = (page - 1) * limit;
	queryPaginationObj['offset'] = offset;
	var maxSize;
	// var vendor_id = req.user.Vendor.id;
	var queryObj = {};
	if (typeof req.query.limit !== 'undefined') {
		if (req.query.limit == 'All') {
			limit = 'NULL';
		} else {
			limit = req.query.limit;
			limit = parseInt(limit);
		}
	}
	queryObj = {
		user_id: req.user.id,
		status: 1
	};
	var wishModel = 'WishList';
	var includeArr = [{
		model: model['Product'],
		include: [{
			model: model['ProductMedia'],
			where: {
				base_image: 1
			},
			required: false
		}, {
			model: model['Vendor'],
			include: [{
				model: model['User'],
				attributes: ['id', 'first_name', 'last_name'],
			}]
		}]
	}];
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
			wishlist: function(callback) {
				service.findAllRows(wishModel, includeArr, queryObj, offset, limit, field, order)
					.then(function(category) {
						return callback(null, category);
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
		},
		function(err, results) {

			if (!err) {
				if (results.wishlist) {
					var maxSize = results.wishlist.count / limit;
					if (results.wishlist.count % limit)
						maxSize++;
					queryPaginationObj['maxSize'] = maxSize;
				} else {
					queryPaginationObj['maxSize'] = 2;
				}
				res.render('userNav/wishlist', {
					title: "Global Trade Connect",
					wishlist: results.wishlist.rows,
					count: results.wishlist.count,
					categories: results.categories,
					bottomCategory: bottomCategory,
					cart: results.cartInfo,
					marketPlace: marketplace,
					LoggedInUser: LoggedInUser,
					vendorPlan: vendorPlan,
					queryURI: queryURI,
					queryPaginationObj: queryPaginationObj,
					selectedPage: "wishlist",
				});
			} else {
				res.render('userNav/wishlist', err);
			}
		});
}

function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}