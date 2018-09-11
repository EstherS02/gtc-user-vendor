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
	var bottomCategory={};

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
		queryPaginationObj["field"] = field;
	}

	var order = "desc"; //"asc"
	var offset = 0;
	var limit = 1;
	
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
	delete req.query.limit;
	order = req.query.order ? req.query.order : "desc";

	delete req.query.order;
	page = req.query.page ? parseInt(req.query.page) : 1;
	delete req.query.page;

	offset = (page - 1) * limit;
	var maxSize;
	// End pagination
	async.series({
		cartCounts: function(callback) {
            service.cartHeader(LoggedInUser).then(function(response) {
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
						starCount: 7,
						ratingCount: 0
					}, {
						starCount: 6,
						ratingCount: 0
					},{
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
						if (rating[key].rating <= 7)
							productRating[7 - rating[key].rating].ratingCount = productRating[7 - rating[key].rating].ratingCount + 1;
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
			},
			userReviews: function(callback){
				model['Review'].findAndCountAll({
					where: queryObj,
					offset: offset,
					limit: limit,
					order: [
						[field, order]
					],
					attributes: [
				'rating','title','comment', [sequelize.fn('COUNT', sequelize.col('Review.user_id')), 'userCount']
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
					var responseRatings = JSON.parse(JSON.stringify(Reviews.rows));
					if (responseRatings.length > 0) {
						for (var i = 0; i < productRating.length; i++) {
							for (var j = 0; j < responseRatings.length; j++) {
								if (productRating[i].rating == responseRatings[j].rating) {
									total = total+responseRatings[j].userCount;
									productRating[i].userCount = responseRatings[j].userCount;
								}
							}
						}
					}
					Reviews.productRating = productRating;
					Reviews.avgRating = (total > 0) ? (total / responseRatings.length).toFixed(1) : 0;
					var counts = JSON.parse(JSON.stringify(Reviews.count));
					var count = 0;
					if(counts>0){
						for(var a=0;a<counts.length;a++){
							console.log("-------",counts[a].count)
							count = count+counts[a].count;
						}
					}
					Reviews.totalCount = count;
					maxSize = Reviews.count.length / limit;
					return callback(null, Reviews);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
			},
		},
		function(err, results) {
			if (!err) {
				console.log("===========================",results.userReviews)
				res.render('vendorNav/reviews', {
					title: "Global Trade Connect",
					Reviews: results.Reviews.rows,
					Ratings: results.userReviews.productRating,
					ratingCount: results.userReviews.totalCount,
					avgRating: results.userReviews.avgRating,
					LoggedInUser: LoggedInUser,
					categories: results.categories,
					cartheader: results.cartCounts,
                    bottomCategory: bottomCategory,
					// pagination
					page: page,
					maxSize: maxSize,
					pageSize: limit,
					queryPaginationObj: queryPaginationObj,
					collectionSize: results.Reviews.count,
					selectedPage: 'reviews',
					// End pagination
					vendorPlan: vendorPlan,
					queryURI: queryURI,
					userReviews:results.userReviews,
					userCollectionSize: results.userReviews.count,
				});
			} else {
				res.render('vendorNav/reviews', err);
			}
		});

}