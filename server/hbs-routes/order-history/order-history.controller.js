'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');
const marketPlace = require('../../config/marketplace');
import series from 'async/series';
var async = require('async');

export function orderHistory(req, res) {
	var LoggedInUser = {};
	// console.log(req.user.Vendor.id)
	if (req.user)
		LoggedInUser = req.user;


	var order = "desc"; //"asc"
	var offset = 0;
	var limit = 1;
	// var vendor_id = req.user.Vendor.id;
	var rating_limit = 120;
	var queryObj = {};

	let user_id = LoggedInUser.id;
	//pagination 
	var page;
	offset = req.query.offset ? parseInt(req.query.offset) : 0;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 20;
	delete req.query.limit;
	order = req.query.order ? req.query.order : "desc";
	delete req.query.order;
	page = req.query.page ? parseInt(req.query.page) : 1;
	delete req.query.page;
	var field = "id";
	offset = (page - 1) * limit;
	var maxSize;
	// End pagination

	var modelName = "Order";
	queryObj = {
		user_id: 24
	};
	var includeArr = [{
		model: model["User"]
	}, {
		model: model["OrderItem"],
		include: [{
			model: model['Product'],
			include: [{
				model: model['Vendor'],
			}]
			// attributes:['id','product_id','final_price',[Sequelizs.fn('SUM', sequelize.col('OrderItems.final_price')), 'total_trans']]
		}]
	}];
	async.series({
			orderHistory: function(callback) {
				service.findRows(modelName, queryObj, offset, limit, field, order, includeArr)
					.then(function(results) {
						// console.log(results)
						return callback(null, results);
					}).catch(function(error) {
						console.log('Error :::', error);
						return callback(null);
					});
			}
		},
		function(err, results) {
			if (!err) {
				// console.log(marketPlace);
				res.render('order-history', {
					title: "Global Trade Connect",
					orderHistory: results.orderHistory.rows,
					count: results.orderHistory.count,
					LoggedInUser: LoggedInUser,
					marketPlace: marketPlace
				});
			} else {
				res.render('order-history', err);
			}
		});
	
}