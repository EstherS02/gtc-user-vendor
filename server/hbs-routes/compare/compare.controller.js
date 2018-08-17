'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const service = require('../../api/service');
const productService = require('../../api/product/product.service');
const sequelize = require('sequelize');
const moment = require('moment');
const _ = require('lodash');
import series from 'async/series';
var async = require('async');

export function compare(req, res) {
	var LoggedInUser = {};
	var bottomCategory = {};

	if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable) {
		LoggedInUser = req.gtcGlobalUserObj;
	}

	var field = 'id';
	var order = 'asc';
	var includeArr = [];
	var compareProductIDs;

	if (req.session && req.session['compare']) {
		compareProductIDs = req.session['compare'].join(", ");
	}

	async.series({
		compareProducts: function(callback) {
			productService.compareProducts(compareProductIDs)
				.then((response) => {
					return callback(null, response);
				}).catch((error) => {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		productAttributes: function(callback) {
			var offset = 0;
			var limit = null;
			var field = "id";
			var order = "ASC";
			var queryObj = {};
			var includeArr = [];
			var productAttributeModel = "ProductAttribute";

			queryObj['status'] = status['ACTIVE'];
			queryObj['product_id'] = req.session['compare'];

			includeArr = [{
				model: model['Attribute'],
				where: {
					status: status['ACTIVE']
				},
				attributes: ['id', 'attr_name', 'attr_required', 'unit', 'status']
			}];

			service.findAllRows(productAttributeModel, includeArr, queryObj, offset, limit, field, order)
				.then((response) => {
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
		cartCounts: function(callback) {
			service.cartHeader(LoggedInUser).then(function(response) {
				return callback(null, response);
			}).catch(function(error) {
				console.log('Error :::', error);
				return callback(null);
			});
		}
	}, function(error, results) {
		var newAttributes = [];
		if (!error) {
			if (results.productAttributes.count > 0) {
				newAttributes = _.unionBy(results.productAttributes.rows, newAttributes, 'attribute_id');
			}

			res.render('compare', {
				title: "Global Trade Connect",
				categories: results.categories,
				bottomCategory: bottomCategory,
				cartheader: results.cartCounts,
				compareProducts: results.compareProducts,
				uniqueAttribute: newAttributes,
				productAttributes: results.productAttributes.rows,
				LoggedInUser: LoggedInUser
			});
		} else {
			res.render('compare', err);
		}
	});
}