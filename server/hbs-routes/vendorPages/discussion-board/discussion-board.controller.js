'use strict';

const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const status = require('../../../config/status');
const verificationStatus = require('../../../config/verification_status');
const service = require('../../../api/service');
const sequelize = require('sequelize');
const marketplace = require('../../../config/marketplace');
const cartService = require('../../../api/cart/cart.service');
const marketplace_type = require('../../../config/marketplace_type');
const Plan = require('../../../config/gtc-plan');
const moment = require('moment');
const _ = require('lodash');
const async = require('async');

export function vendorDiscussion(req, res) {
	var categoryModel = "Category";
	var bottomCategory = {};
	var LoggedInUser = {};

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;
	var discussModelComment = "DiscussionBoardPostComment";
	var discussModelLike = "DiscussionBoardPostLike";
	var discussModel = "DiscussionBoardPost";
	var offset, limit, field, order, page;
	var queryPaginationObj = {};
	var queryObj = {};
	var queryURI = {};
	var vendor_id = req.params.id;
	queryObj['vendor_id'] = vendor_id;
	queryObj['status'] = status["ACTIVE"];

	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	queryPaginationObj['offset'] = offset;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 10;
	queryPaginationObj['limit'] = limit;
	delete req.query.limit;
	field = req.query.field ? req.query.field : "created_on";
	queryPaginationObj['field'] = field;
	delete req.query.field;
	order = req.query.order ? req.query.order : "desc";
	queryPaginationObj['order'] = order;
	delete req.query.order;

	page = req.query.page ? parseInt(req.query.page) : 1;
	queryPaginationObj['page'] = page;
	queryURI['page'] = page;
	delete req.query.page;

	offset = (page - 1) * limit;
	queryPaginationObj['offset'] = offset;
	var includeArr = [{
		model: model['DiscussionBoardPostLike'],
		where: {
			status: status['ACTIVE']
		},
		required: false
	}, {
		model: model['DiscussionBoardPostComment'],
		include: [{
			model: model["User"],
			attributes: {
				exclude: ['hashed_pwd', 'salt', 'email_verified_token', 'email_verified_token_generated', 'forgot_password_token', 'forgot_password_token_generated']
			},
		}]
	}, {
		model: model['Vendor']
	}, {
		model: model["User"],
		attributes: {
			exclude: ['hashed_pwd', 'salt', 'email_verified_token', 'email_verified_token_generated', 'forgot_password_token', 'forgot_password_token_generated']
		},
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
		discussion: function(callback) {
			model['DiscussionBoardPost'].findAll({
				where: queryObj,
				include: includeArr,
				offset: offset,
				limit: limit,
				order: [
					[field, order],
					[model['DiscussionBoardPostComment'], field, order]
				]
			}).then(function(rows) {
				var result = [];
				var convertRowsJSON = [];
				if (rows.length > 0) {
					convertRowsJSON = JSON.parse(JSON.stringify(rows));
					model['DiscussionBoardPost'].count({
						where: queryObj
					}).then(function(count) {
						result.count = count;
						result.rows = convertRowsJSON;
						return callback(null, result);
					});
				} else {
					result.count = 0;
					result.rows = convertRowsJSON;
					return callback(null, result);
				}
			}).catch(function(error) {
				console.log('Error :::', error);
				return callback(null);
			});
		},
		mostPopular: function(callback) {
			model['DiscussionBoardPost'].findAll({
				where: queryObj,
				include: [{
					model: model['DiscussionBoardPostLike'],
					where: {
						status: status['ACTIVE']
					},
				}],
				offset: 0,
				limit: 5,
				order: [
					[field, order],
				]
			}).then(function(rows) {
				return callback(null, rows);
			}).catch(function(error) {
				console.log('Error :::', error);
				return callback(null);
			});
		},
		VendorDetail: function(callback) {
			var vendorIncludeArr = [{
				model: model['Country']

			}, {
				model: model['VendorPlan'],
				where: {
					status: status['ACTIVE'],
					start_date: {
						'$lte': moment().format('YYYY-MM-DD')
					},
					end_date: {
						'$gte': moment().format('YYYY-MM-DD')
					}
				},

				required: false
			}, {
				model: model['VendorVerification'],
				where: {
					vendor_verified_status: verificationStatus['APPROVED']
				},
				required: false
			}, {
				model: model['VendorFollower'],
				where: {
					user_id: req.user.id,
					status: 1
				},
				required: false
			}, {
				model: model['VendorRating'],
				attributes: [
					[sequelize.fn('AVG', sequelize.col('VendorRatings.rating')), 'rating'],
					[sequelize.fn('count', sequelize.col('VendorRatings.rating')), 'count']
				],
				group: ['VendorRating.vendor_id'],
				required: false,
			}];
			service.findIdRow('Vendor', vendor_id, vendorIncludeArr)
				.then(function(response) {
					return callback(null, response);

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

			categoryQueryObj['status'] = status["ACTIVE"];

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
		Rating: function(callback) {
			model['Review'].findAndCountAll({
				include:[{
					model: model['Product'],
					where:{
						vendor_id: vendor_id
					}
				}],
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
				return callback(null, Reviews);
			}).catch(function(error) {
				console.log('Error :::', error);
				return callback(null);
			});
		}
	}, function(err, results) {
		if (!err) {
			var maxSize = 5;
			queryPaginationObj['maxSize'] = 5;
			
			res.render('vendorPages/vendor-discussion', {
				title: "Global Trade Connect",
				discussionBoard: results.discussion,
				categories: results.categories,
				bottomCategory: bottomCategory,
				queryPaginationObj: queryPaginationObj,
				VendorDetail: results.VendorDetail,
				marketPlace: marketplace,
				cart: results.cartInfo,
				queryURI: queryURI,
				marketPlaceType: marketplace_type,
				publicShop: results.publicShop,
				mostPopular: results.mostPopular,
				LoggedInUser: LoggedInUser,
				selectedPage: 'discussion-board',
				Plan: Plan,
				avgRating: results.Rating.avgRating,
				ratingCount: results.Rating.totalCount
			});
		} else {
			res.render('404');
		}
	});
}