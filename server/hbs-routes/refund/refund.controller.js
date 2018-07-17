'use strict';
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../../api/service');
const statusCode = require('../../config/status');
const sequelize = require('sequelize');
const moment = require('moment');
const populate = require('../../utilities/populate');
var async = require('async');
const vendorPlan = require('../../config/gtc-plan');

export function refund(req, res) {

	var itemModel = "OrderItem";
	var searchObj = {},
		LoggedInUser = {};
	var productIncludeArr = [];
	var offset, limit, field, order;
	offset = 0;
	limit = null;
	field = "id";
	order = "asc";

	if (req.user)
		LoggedInUser = req.user;

	var productIncludeArr = [{
		model: model['Product'],
		include: [{
			model: model['ProductMedia'],
			attribute: ['url']
		}, {
			model: model['Vendor']
		}, {
			model: model['Category']
		}, {
			model: model['SubCategory']
		}]
	}, {
		model: model['Order'],
		include: [{
			model: model['User']
		}]
	}];
	// populate.populateData('Product,Product.ProductMedia,Product.Vendor,Product.Category,
	// Product.SubCategory,Order,Order.User');

	if (req.params.id)
		searchObj["id"] = req.params.id;

	var queryObjCategory = {
		status: statusCode['ACTIVE']
	};

	async.series({
		item: function(callback) {
			service.findOneRow(itemModel, searchObj, productIncludeArr)
				.then(function(item) {
					return callback(null, item);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		category: function(callback) {
			service.findRows("Category", queryObjCategory, 0, null, 'id', 'asc')
				.then(function(category) {
					return callback(null, category.rows);

				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		}
	}, function(err, results) {
		// console.log(results.item.Order);
		if (!err) {
			res.render('refund', {
				title: "Global Trade Connect",
				item: results.item,
				category: results.category,
				LoggedInUser: LoggedInUser,
				vendorPlan: vendorPlan
			});
		} else {
			res.render('refund', err);
		}
	});
}