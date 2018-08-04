'use strict';

const config = require('../../../config/environment');
const model = require('../../../sqldb/model-connect');
const reference = require('../../../config/model-reference');
const status = require('../../../config/status');
const service = require('../../../api/service');
const sequelize = require('sequelize');
const marketplace = require('../../../config/marketplace');
const marketplace_type = require('../../../config/marketplace_type');
const Plan = require('../../../config/gtc-plan');
const moment = require('moment');
import series from 'async/series';
var async = require('async');

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
		model:model['DiscussionBoardPostLike']
	},{
		model:model['DiscussionBoardPostComment'],
		include:[{
			model: model["User"],
				attributes: {
					exclude: ['hashed_pwd', 'salt', 'email_verified_token', 'email_verified_token_generated', 'forgot_password_token', 'forgot_password_token_generated']
				},
		}]
	},{
		model:model['Vendor']
	}];
	async.series({
		cartCounts: function(callback) {
			service.cartHeader(LoggedInUser).then(function(response) {
				return callback(null, response);
			}).catch(function(error) {
				console.log('Error :::', error);
				return callback(null);
			});
		},
		discussion: function(callback) {
			service.findRows(discussModel, queryObj, offset, limit, field, order,includeArr)
				.then(function(response) {
					console.log(response.rows)
					return callback(null, response);

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
				required: false
			}, {
				model: model['VendorVerification'],
				where: {
					vendor_verified_status: status['ACTIVE']
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
	}, function(err, results) {
		// console.log(results.discussion, queryObj)
		
		if (!err) {
			if (results.discussion) {
			var maxSize = results.discussion.count / limit;
			if (results.discussion.count % limit)
				maxSize++;
			queryPaginationObj['maxSize'] = maxSize;
		}

			res.render('vendorPages/vendor-discussion', {
				title: "Global Trade Connect",
				discussionBoard: results.discussion,
				categories: results.categories,
				bottomCategory: bottomCategory,
				queryPaginationObj: queryPaginationObj,
				VendorDetail: results.VendorDetail,
				marketPlace: marketplace,
				cartheader: results.cartCounts,
				queryURI: queryURI,
				marketPlaceType: marketplace_type,
				publicShop: results.publicShop,
				// categories: results.categories,
				LoggedInUser: LoggedInUser,
				selectedPage: 'discussion-board',
				Plan: Plan,
			});
		} else {
			res.render('vendor-discussion', err);
		}
	});
}