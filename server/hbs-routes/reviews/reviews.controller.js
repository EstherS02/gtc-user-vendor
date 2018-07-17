'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');
var async = require('async');
const vendorPlan = require('../../config/gtc-plan');

export function reviews(req, res) {
	var LoggedInUser = {};
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
	var vendor_id = req.user.Vendor.id;
	var rating_limit = 120;
	var queryObj = {};
	queryObj = {
		vendor_id: vendor_id,
	};

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
	async.series({
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
					maxSize = Reviews.count / limit;
					console.log('max', maxSize);
					return callback(null, Reviews);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
			},
			Rating: function(callback) {
				var total = 0;
				var star5 = 0;
				var star4 = 0;
				var star3 = 0;
				var star2 = 0
				var star1 = 0;
				model['VendorRating'].findAndCountAll({
					where: queryObj,
					limit: rating_limit,
					order: [
						[field, order]
					],
					attributes: ['rating'],
					raw: true
				}).then(function(Rating) {
					var productRating = [{
						starCount: 5,
						ratingCount: 0
					}, {
						starCount: 4,
						ratingCount: 0
					}, {
						starCount: 3,
						ratingCount: 0
					}, {
						starCount: 2,
						ratingCount: 0
					}, {
						starCount: 1,
						ratingCount: 0
					}];

					var total = 0;
					var rating = Rating.rows;;

					for (let key in rating) {
						total = total + rating[key].rating;
						if (rating[key].rating <= 5)
							productRating[5 - rating[key].rating].ratingCount = productRating[5 - rating[key].rating].ratingCount + 1;
					}
					var avgRating = (total > 0) ? (total / rating.length).toFixed(1) : 0;
					Rating.productRating = productRating;
					Rating.avgRating = avgRating;

					// productRating = productRating
					return callback(null, Rating);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
			}
		},
		function(err, results) {
			if (!err) {
				res.render('vendorNav/reviews', {
					title: "Global Trade Connect",
					Reviews: results.Reviews.rows,
					Ratings: results.Rating.productRating,
					ratingCount: results.Rating.count,
					avgRating: results.Rating.avgRating,
					LoggedInUser: LoggedInUser,
					// pagination
					page: page,
					maxSize: maxSize,
					pageSize: limit,
					queryPaginationObj: queryPaginationObj,
					collectionSize: results.Reviews.count,
					selectedPage: 'reviews',
					// End pagination
					vendorPlan: vendorPlan
				});
			} else {
				res.render('vendorNav/reviews', err);
			}
		});

}