'use strict';

const crypto = require('crypto');
const uuid = require('node-uuid');
const expressValidator = require('express-validator');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const status = require('../../config/status');
const service = require('../service');

export function updateCoupon(req, res) {
	var modelName = 'Coupon';
	var newCoupon = {};
	var id = req.body.id;
	newCoupon.coupon_name = req.body.coupon_name;
	newCoupon.discount_type = req.body.discount_type;
	newCoupon.discount_value = req.body.discount_value;
	newCoupon.expiry_date = req.body.expiry_date;
	newCoupon.minimum_spend = req.body.minimum_spend;
	newCoupon.maximum_spend = req.body.maximum_spend;
	newCoupon.individual_use_only = req.body.individual_use_only;
	newCoupon.excluse_sale_item = req.body.excluse_sale_item;
	newCoupon.status = 1;
	newCoupon.usage_limit = req.body.usage_limit;
	newCoupon.limit_usage_to_x_items = req.body.limit_usage_to_x_items;
	newCoupon.usage_limit_per_user = req.body.usage_limit_per_user;
	newCoupon.discount_value = req.body.discount_value;
	newCoupon.discount_value = req.body.discount_value;

	var queryObj = {};
	var includeArr = [];

	service.updateRow(modelName, newCoupon, id).then(function(results) {
		if (results) {
			return res.status(200).send(results);
		} else {
			return res.status(404).send("Not found");
		}
	}).catch(function(error) {
		console.log('Error:::', error);
		res.status(500).send("Internal server error");
		return;
	});
}

export function updateProductCoupon(req, res) {
	var id = req.body.id;
	var newCouponArry = JSON.parse(req.body.couponArray);
	var modelName = req.body.modelName;
	console.log(req.body.couponProducts);
	model[modelName].update({
		status: 0
	}, {
		where: {
			coupon_id: id
		}
	}).then(function(row) {
		console.log("updateProductCoupon", row);
		if (newCouponArry) {

			newCouponArry.forEach(function(element) {
				console.log('new', element);
				var data = {};
				var queryObj = {};
				var includeArr = [];
				data = {
					coupon_id: id,
					product_id: element,
					status: 1
				};
				queryObj = {
					coupon_id: id,
					product_id: element
				};
				service.findOneRow(modelName, queryObj, includeArr)
					.then(function(results) {
						if (results) {
							var id = results.id;
							data.last_updated_on = new Date();
							service.updateRow(modelName, data, id).then(function(response) {
								return;
							});
						} else {
							data.created_on = new Date();
							service.createRow(modelName, data).then(function(response) {
								return;
							});
						}
					});
			});
			return;
		}
	});
}
export function updateCategoryCoupon(req, res) {
	var id = req.body.id;
	var newCouponArry = JSON.parse(req.body.couponArray);
	var modelName = req.body.modelName;
	console.log(req.body.couponProducts);
	model[modelName].update({
		status: 0
	}, {
		where: {
			coupon_id: id
		}
	}).then(function(row) {
		console.log("updateProductCoupon", row);
		if (newCouponArry) {
			newCouponArry.forEach(function(element) {
				console.log('new', element);
				var data = {};
				var queryObj = {};
				var includeArr = [];
				data = {
					coupon_id: id,
					category_id: element,
					status: 1
				};
				queryObj = {
					coupon_id: id,
					category_id: element
				};
				service.findOneRow(modelName, queryObj, includeArr)
					.then(function(results) {
						if (results) {
							var id = results.id;
							data.last_updated_on = new Date();
							service.updateRow(modelName, data, id).then(function(response) {
								return;
							});
						} else {
							data.created_on = new Date();
							service.createRow(modelName, data).then(function(response) {
								return;
							});
						}
					});
			});
		}
	});
}

export function createCoupon(req, res){
	
}