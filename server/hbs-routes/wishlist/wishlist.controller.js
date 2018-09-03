'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');
const async = require('async');
const vendorPlan = require('../../config/gtc-plan');

export function wishlist(req, res) {

	var categoryModel = "Category";
	var bottomCategory = {};
	var LoggedInUser = {};
	var queryURI = {};
	if (req.user)
		LoggedInUser = req.user;
	var queryPaginationObj={};
	let user_id = LoggedInUser.id;

	var field = 'id';
	var order = "desc";
	var offset = 0;
	// var limit = 10;
	var limit = req.query.limit ? parseInt(req.query.limit) : 10;
	queryPaginationObj['limit'] = limit;
	queryURI['limit'] = limit;
	delete req.query.limit;
	var page = req.query.page ? parseInt(req.query.page) : 1;
	queryPaginationObj['page'] = offset;
	queryURI['page'] = limit;
	delete req.query.page;
	var field = "id";
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
		cartCounts: function(callback) {
            service.cartHeader(LoggedInUser).then(function(response) {
                return callback(null, response);
            }).catch(function(error) {
                console.log('Error :::', error);
                return callback(null);
            });
        },
			wishlist: function(callback) {
				service.findAllRows(wishModel, includeArr, queryObj, offset, limit, field, order)
					.then(function(category) {
						console.log(category.rows)
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
				if(results.wishlist){
				var maxSize = results.wishlist.count / limit;
				if (results.wishlist.count % limit)
					maxSize++;
				queryPaginationObj['maxSize'] = maxSize;
				}else{
					queryPaginationObj['maxSize'] = 0;
				}
				res.render('userNav/wishlist', {
					title: "Global Trade Connect",
					wishlist: results.wishlist.rows,
					count: results.wishlist.count,
					categories: results.categories,
				    bottomCategory: bottomCategory,
				    cartheader: results.cartCounts,
					LoggedInUser: LoggedInUser,
					vendorPlan:vendorPlan,
					page: offset,
					maxSize: maxSize,
					queryURI: queryURI,
					pageSize: limit,
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