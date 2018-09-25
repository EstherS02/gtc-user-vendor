'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const cartService = require('../../api/cart/cart.service');
const marketplace = require('../../config/marketplace');
const sequelize = require('sequelize');
const moment = require('moment');
var async = require('async');
const vendorPlan = require('../../config/gtc-plan');

export function reviews(req, res) {
	var LoggedInUser = {};
	var bottomCategory = {};

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;
	var queryPaginationObj = {};
	var queryURI = {};
	var vendorId;

	// queryURI['vendor_id']=req.query.vendor_id;

	if (req.query.sort == 'rating') {
		var field = req.query.sort;
		queryPaginationObj["field"] = field;
	} else {
		var field = 'id';
		queryPaginationObj["field"] = req.query.sort;
	}

	var order = "desc"; //"asc"
	var offset = 0;
	var limit;

	vendorId = req.query.vendor_id;
	var rating_limit = 120;
	var queryObj = {};
	queryObj = {
		user_id: user_id,
	};

	//pagination 
	var page;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 5;
	queryPaginationObj['limit'] = limit;
	delete req.query.limit;
	order = req.query.order ? req.query.order : "desc";

	delete req.query.order;
	page = req.query.page ? parseInt(req.query.page) : 1;
	queryPaginationObj['page'] = page;
	delete req.query.page;

	offset = (page - 1) * limit;
	var maxSize;
	// End pagination
	async.series({
			cartInfo: function(callback) {
				if (LoggedInUser.id) {
					cartService.cartCalculation(LoggedInUser.id)
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
			Reviews: function(callback) {
				model['VendorRating'].findAndCountAll({
					where: queryObj,
					offset: offset,
					limit: limit,
					order: [
						[field, order]
					],
					include: [{
						model: model['User']
					}]
				}).then(function(Reviews) {
					// maxSize = Reviews.count / limit;
					return callback(null, Reviews);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
			},
			Rating: function(callback) {
				model['Review'].findAndCountAll({
					where: queryObj,
					// offset:0,
					// limit:4,
					attributes: [
						'rating', 'title', 'comment', 'created_on', 'id', [sequelize.fn('COUNT', sequelize.col('Review.user_id')), 'userCount']
					],
					group: ['Review.rating']

				}).then(function(Reviews) {
					var productRating = [{
						"rating": 7,
						"userCount": 0
					}, {
						"rating": 6,
						"userCount": 0
					}, {
						"rating": 5,
						"userCount": 0
					}, {
						"rating": 4,
						"userCount": 0
					}, {
						"rating": 3,
						"userCount": 0
					}, {
						"rating": 2,
						"userCount": 0
					}, {
						"rating": 1,
						"userCount": 0
					}];
					var total = 0;
					var totalAmt = 0;
					var responseRatings = JSON.parse(JSON.stringify(Reviews.rows));
					if (responseRatings.length > 0) {
						for (var i = 0; i < productRating.length; i++) {
							for (var j = 0; j < responseRatings.length; j++) {
								if (productRating[i].rating == responseRatings[j].rating) {
									total = total + responseRatings[j].userCount;
									totalAmt = totalAmt + (responseRatings[j].userCount * responseRatings[j].rating)
									productRating[i].userCount = responseRatings[j].userCount;
								}
							}
						}
					}
					Reviews.productRating = productRating;
					Reviews.avgRating = (totalAmt > 0) ? (totalAmt / total).toFixed(1) : 0;
					var counts = JSON.parse(JSON.stringify(Reviews.count));
					var count = 0;

					if (counts.length > 0) {
						for (var a = 0; a < counts.length; a++) {
							count = count + counts[a].count;
						}
					}
					Reviews.totalCount = count;
					queryPaginationObj['maxSize'] = count / limit;
					queryPaginationObj['count'] = count;
					return callback(null, Reviews);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
			},
			userReviews: function(callback) {
				model['Review'].findAndCountAll({
					where: queryObj,
					include: [{
						model: model['User'],
						attributes: {
							exclude: ['hashed_pwd', 'salt', 'email_verified_token', 'email_verified_token_generated', 'forgot_password_token', 'forgot_password_token_generated']
						}
					}, {
						model: model['Product']
					}],
					offset: offset,
					limit: limit,
					order: [
						[field, order]
					]
				}).then(function(Reviews) {
					return callback(null, Reviews);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
			},
		},
		function(err, results) {
			if (!err) {
				res.render('vendorNav/reviews', {
					title: "Global Trade Connect",
					Reviews: results.Reviews.rows,
					Ratings: results.Rating.productRating,
					ratingCount: results.Rating.totalCount,
					avgRating: results.Rating.avgRating,
					LoggedInUser: LoggedInUser,
					categories: results.categories,
					cart: results.cartInfo,
					marketPlace: marketplace,
					bottomCategory: bottomCategory,
					// pagination
					page: page,
					pageSize: limit,
					queryPaginationObj: queryPaginationObj,
					collectionSize: results.Reviews.count,
					selectedPage: 'reviews',
					// End pagination
					vendorPlan: vendorPlan,
					queryURI: queryURI,
					userReviews: results.userReviews,
					userCollectionSize: results.userReviews.count,
				});
			} else {
				res.render('vendorNav/reviews', err);
			}
		});
}