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

export function wishlist(req, res) {
	var field = 'id';
	var order = "desc";
	var offset = 0;
	var limit = 10;
	var vendor_id = 29;
	var queryObj = {};
	if (typeof req.query.limit !== 'undefined') {
		limit = req.query.limit;
		limit = parseInt(limit);
	}
	queryObj = {
		user_id: 62
	};
	var wishModel = 'WishList';
	var includeArr = [{
		model: model['Product'],
		include: [{
			model: model['ProductMedia'],
		}]
	}, {
		model: model['User']
	}];
	async.series({
			wishlist: function(callback) {
				service.findAllRows(wishModel, includeArr, queryObj, offset, limit, field, order)
					.then(function(category) {
						// console.log(category)
						return callback(null, category);
					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(null);
					});
			},
		},
		function(err, results) {
			if (!err) {
				res.render('wishlist', {
					title: "Global Trade Connect",
					wishlist: results.wishlist.rows,
					count: results.wishlist.count
				});
			} else {
				res.render('wishlist', err);
			}
		});
}

function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}