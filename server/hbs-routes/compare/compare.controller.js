'use strict';

const _ = require('lodash');
const async = require('async');
const sequelize = require('sequelize');
const model = require('../../sqldb/model-connect');
const status = require('../../config/status');
const marketplace = require('../../config/marketplace');
const service = require('../../api/service');
const cartService = require('../../api/cart/cart.service');
const productService = require('../../api/product/product.service');
const Plan = require('../../config/gtc-plan');

export function compare(req, res) {
	var LoggedInUser = {}, bottomCategory = {};

	if (req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable) {
		LoggedInUser = req.gtcGlobalUserObj;
	}
	var field = 'id';
	var order = 'asc';
	var includeArr = [];
	var compareProductIDs;
	var product_category_id = [];

	if (req.session && req.session['compare']) {
		compareProductIDs = req.session['compare'].join(", ");
	}

	async.series({
		compareProducts: function(callback) {

			if(compareProductIDs){
				productService.compareProducts(compareProductIDs)
				.then((response) => {
					if (response.length > 0) {
						
						product_category_id = [];
						_.forOwn(response, function(element) {
							product_category_id.push(element.sub_category_id);
						});
					}
					return callback(null, response);
				}).catch((error) => {
					console.log('Error :::', error);
					return callback(null);
				});
			}else{
				return callback(null);	
			}		
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
		RelatedProducts: function(callback) {
			var limit = 9;
			var offset = 0;
			var order = [
				sequelize.fn('RAND'),
			];
			var queryObj = {
				sub_category_id: product_category_id,
				marketplace_id: {
					$ne: marketplace['WHOLESALE']
				}
			};

			if (product_category_id.length > 0) {
				productService.queryAllProducts(LoggedInUser.id, queryObj, offset, limit)
				.then(function(publicMarketplace) {
					return callback(null, publicMarketplace);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
			} else {
				return callback(null);
			}
		},
		categories: function(callback) {
			var includeArr = [];
			var categoryOffset, categoryLimit, categoryField, categoryOrder;
			var categoryQueryObj = {};

			categoryOffset = 0;
			categoryLimit = null;
			categoryField = "id";
			categoryOrder = "asc";
			
			categoryQueryObj['status'] = status["ACTIVE"];

			service.findAllRows('Category', includeArr, categoryQueryObj, categoryOffset, categoryLimit, categoryField, categoryOrder)
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
		cartInfo: function(callback) {
			if (LoggedInUser.id) {
				cartService.cartCalculation(LoggedInUser.id, req, res)
					.then((cartResult) => {
						return callback(null, cartResult);
					}).catch((error) => {
						return callback(error);
					});
			} else {
				return callback(null);
			}
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
				cart: results.cartInfo,
				marketPlace: marketplace,
				compareProducts: results.compareProducts,
				RelatedProducts: results.RelatedProducts,
				uniqueAttribute: newAttributes,
				productAttributes: results.productAttributes.rows,
				LoggedInUser: LoggedInUser,
				Plan: Plan
			});
		} else {
			res.render('compare', err);
		}
	});
}