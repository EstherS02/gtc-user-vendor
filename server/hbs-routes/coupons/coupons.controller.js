'use strict';

const async = require('async');

const populate = require('../../utilities/populate')
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const statusCode = require('../../config/status');
const discountType = require('../../config/discount');
const service = require('../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');


export function coupons(req, res) {
	var field = 'id';
	var order = "desc";
	var offset = 0;
	var limit = 10;
	var queryObj = {};

	if (typeof req.query.limit !== 'undefined') {
		limit = req.query.limit;
		limit = parseInt(limit);
	}
	if (typeof req.query.status !== 'undefined') {
		var status = '';
		if (status = statusCode[req.query.status])
			queryObj['status'] = parseInt(status);
	}

	queryObj['vendor_id'] = 28;

	console.log('queryObj', queryObj);

	async.series({
			Coupons: function(callback) {
				model['Coupon'].findAndCountAll({
					where: queryObj,
					offset: offset,
					limit: limit,
					order: [
						[field, order]
					],
					raw: true
				}).then(function(Coupons) {
					return callback(null, Coupons);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
			}
		},
		function(err, results) {
			if (!err) {
				res.render('view-coupons', {
					title: "Global Trade Connect",
					Coupons: results.Coupons.rows,
					count: results.Coupons.count,
					statusCode: statusCode,
					discountType: discountType
				});
			} else {
				res.render('view-coupons', err);
			}
		});
}

export function addCoupon(req, res) {

	var productModel = "Product";
	var categoryModel = "Category";

	var offset, limit, field, order;
	var productQueryObj = {};
	var categoryQueryObj = {};

	field = "id";
	order = "asc";

	productQueryObj['status'] = status["ACTIVE"];
	categoryQueryObj['status'] = status["ACTIVE"];

	productQueryObj['vendor_id'] = 28;

	async.series({
		products: function(callback) {
			service.findRows(productModel, productQueryObj, offset, limit, field, order)
				.then(function(products) {
					return callback(null, products.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
		categories: function(callback) {
			service.findRows(categoryModel, categoryQueryObj, offset, limit, field, order)
				.then(function(categories) {
					return callback(null, categories.rows);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
		}
	}, function(err, results) {
		if (!err) {
			res.render('edit-coupon', {
				title: "Global Trade Connect",
				products: results.products,
				categories: results.categories
			});
		} else {
			res.render('services', err);
		}
	});
}

export function editCoupons(req, res) {
	
	var queryObj = {};
	var includeArr = [];
	var modelName = "Coupon";

	queryObj['id'] = req.query.id;
	queryObj['vendor_id'] = 28;

	includeArr = populate.populateData("");

	service.findOneRow(modelName, queryObj, includeArr)
		.then(function(row) {
			console.log('row', row);
			res.render('edit-coupon', {
				title: "Global Trade Connect",
				coupon: row
			});
		}).catch(function(error) {
			console.log('Error:::', error);
			res.render('edit-coupon', error);
		});

	//includeArr = populate.populateData("CouponExcludedProduct,CouponExcludedProduct.Product,CouponProduct,");
	//console.log('includeArr', includeArr);
	
	/*var chkArray = req.query.id;
	var selected = chkArray.split(',');
	var queryObj = {};
	var created_by = 29;
	queryObj['created_by'] = created_by;
	queryObj['id'] = selected;
	async.series({
			Coupons: function(callback) {
				model['Coupon'].findOne({
					where: queryObj,
					include: [{

						model: model['CouponExcludedProduct'],
						attributes: ['id', 'coupon_id', 'product_id'],
						include: [{
							model: model['Product'],
							attributes: ['id', 'product_name']
						}]
					}, {
						model: model['CouponProduct'],
						attributes: ['id', 'coupon_id', 'product_id'],
					}, {
						model: model['CouponCategory'],
						attributes: ['id', 'coupon_id', 'category_id'],
						include: [{
							model: model['Category'],
							attributes: ['id', 'name']
						}]
					}, {
						model: model['CouponExcludedCategory'],
						attributes: ['id', 'coupon_id', 'category_id'],
						include: [{
							model: model['Category'],
							attributes: ['id', 'name']
						}]
					}],
				}).then(function(Coupons) {
					return callback(null, Coupons);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
			}
		},
		function(err, results) {
			if (!err) {
				res.render('edit-coupon', {
					title: "Global Trade Connect",
					Coupons: results.Coupons,
					statusCode: statusCode,
					discountType: discountType
				});
			} else {
				res.render('edit-coupon', err);
			}
		});*/
}

function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}