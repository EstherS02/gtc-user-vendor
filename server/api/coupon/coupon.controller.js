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
	var productModel = "CouponProduct";
	var categoryModel = "CouponCategory";
	var productExcludeModel = "CouponExcludedProduct";
	var categoryExcludeModel = "CouponExcludedCategory";
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

	var newCouponProducts = JSON.parse(req.body.couponProducts); 
	var newCouponExcludeProducts = req.body.couponExcludeProducts;
	var newCouponCategory = req.body.couponCategories;
	var newCouponExcludeCategory = req.body.couponExcludeCategories;


	console.log('product',newCouponProducts);

	service.updateRow(modelName, newCoupon, id).then(function(results) {
		console.log("talk", results);
		if (results) {
			model[productModel].update({
				status: 0
			}, {
				where: {
					coupon_id: id
				}
			}).then(function(row) {
				console.log("talk_update",row);
				if (row>0) {
					console.log("status 0");
					if(newCouponProducts){
					newCouponProducts.forEach(function(element) {
						console.log('new', element);
						CouponProduct.findOrCreate({
								where: {
									coupon_id: id,
									product_id:element
								},
								defaults:{coupon_id:id,product_id:element,status:1}
							})
							// necessary to use spread to find out if user was found or created
							.spread(function(userResult, created) {
								// this userId was either created or found depending upon whether the argment 'created' is true or false
								// do something with this user now
								if (created) {
									// some logic
									console.log("created");
								} else {
									// some other logic
									console.log("updated");
								}
							}); // end spread
					});
				}
				} else {
					console.log("status 1");
					if(newCouponProducts){
					newCouponProducts.forEach(function(element) {
						console.log(element);
						CouponProduct.findOrCreate({
								where: {
									coupon_id: id,
									product_id:element
								},
								defaults:{status:1}
							})
							// necessary to use spread to find out if user was found or created
							.spread(function(userResult, created) {
								// this userId was either created or found depending upon whether the argment 'created' is true or false
								// do something with this user now
								if (created) {
									// some logic
									console.log("created");
								} else {
									// some other logic
									console.log("updated");
								}
							}); // end spread
					});
				}

				}
			}).catch(function(error) {
				// reject(error);
			})
		} else {
			// service.createRow(modelName,data).then(function(response){
			// });
			res.status(200).send(results);
		}
	}).catch(function(error) {
		console.log('Error:::', error);
		res.status(500).send("Internal server error");
		return;
	});
}