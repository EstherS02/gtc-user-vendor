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

export function productReview(req, res) {

	var product_id = 55;
	var modelName = "Review";
	var order = "desc"; //"asc"
	var offset = 0;
	var limit = 1;
	// var vendor_id = 29;
	var rating_limit = 120;
	var queryObj = {};
	queryObj = {
		product_id: product_id,
	};
	var field = 'id';
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
	var includeArr =  [{
		model: model['User']
	}];
	// End pagination
	async.series({
			Reviews: function(callback) {
				// service.findRows(modelName, queryObj, offset, limit, field, order, includeArr){

				// }
				model['Review'].findAndCountAll({
					where: queryObj,
					offset: offset,
					limit: limit,
					order: [
						[field, order]
					],
					
				}).then(function(Reviews) {
					maxSize = Reviews.count/limit;
					console.log('max',maxSize);
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
				// console.log(results);
				res.render('product-review', {
					title: "Global Trade Connect",
					Reviews: results.Reviews.rows,
					Rating: results.Rating,
					// pagination
					page: page,
					maxSize:maxSize,
					pageSize: limit,
					collectionSize: results.Reviews.count
					// End pagination
				});
			} else {
				res.render('reviews', err);
			}
		});
// res.render('product-review', {
//                     title: "Global Trade Connect",
//                     // LoggedInUser: LoggedInUser
//                 });
}