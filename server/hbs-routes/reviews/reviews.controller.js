'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');
import series from 'async/series';
var async = require('async');

export function reviews(req, res) {
	var LoggedInUser = {};

	if (req.user)
		LoggedInUser = req.user;

	let user_id = LoggedInUser.id;


	if (req.query.sort == 'rating') {
		var field = req.query.sort;
	} else {
		var field = 'id';
	}
	var order = "desc"; //"asc"
	var offset = 0;
	var limit = 10;
	var vendor_id = 29;
	var rating_limit = 120;
	var queryObj = {};
	queryObj = {
		vendor_id: 29,
		review_type: 2 // 1 for product review and 2 for vendor review
	};

	async.series({
			Reviews: function(callback) {
				model['Review'].findAll({
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
				model['Review'].findAndCountAll({
					where: queryObj,
					limit: rating_limit,
					order: [
						[field, order]
					],
					attributes: ['rating'],
					raw: true
				}).then(function(Rating) {
					var rating = Rating.rows;
					for (let elem in rating) {
						total = total + rating[elem].rating;
						switch (rating[elem].rating) {
							case 1:
								star1 = star1 + 1;
								break;
							case 2:
								star2 = star2 + 1;
								break;
							case 3:
								star3 = star3 + 1;
								break;
							case 4:
								star4 = star4 + 1;
								break;
							case 5:
								star5 = star5 + 1;
								break;
						}
					}
					var avg = total / Rating.count;
					Rating.avg = avg;
					Rating.star5 = star5;
					Rating.star4 = star4;
					Rating.star3 = star3;
					Rating.star2 = star2;
					Rating.star1 = star1;
					Rating.total = total;
					// console.log(Rating);
					return callback(null, Rating);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
			}
		},
		function(err, results) {
			if (!err) {
				res.render('reviews', {
					title: "Global Trade Connect",
					Reviews: results.Reviews,
					Rating: results.Rating,
					LoggedInUser: LoggedInUser
				});
			} else {
				res.render('reviews', err);
			}
		});

}