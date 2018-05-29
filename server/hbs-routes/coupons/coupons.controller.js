'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const discountType = require('../../config/discount');
const service = require('../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');

import series from 'async/series';
var async = require('async');


export function coupons(req, res) {
	var field = 'id';
	var order = "desc"; //"asc"
	var offset = 0;
	var created_by = 29;
	var limit = 10; //;
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

	queryObj['created_by'] = created_by;
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

export function addCoupon(req, res){
	res.render('edit-coupon', {
					title: "Global Trade Connect",
				});
}
export function editCoupons(req, res) {
	var  chkArray = req.query.id;
	var selected = chkArray.split(',');
	var queryObj ={};
	var created_by = 29;
	queryObj['created_by'] = created_by;
	queryObj['id'] = selected;
	async.series({
			Coupons: function(callback) {
				model['Coupon'].findOne({
					where: queryObj,
					include:[{
						 
						 model: model['CouponExcludedProduct'],
						 attributes: ['id', 'coupon_id', 'product_id'],
						 include: [{
						 	model:model['Product'],
						 	attributes: ['id', 'product_name']
						 }]
					}, {
						model: model['CouponProduct'],
						attributes: ['id', 'coupon_id', 'product_id'],
					},{
							model:model['CouponCategory'],
							attributes: ['id', 'coupon_id', 'category_id'],
							include:[{
								model:model['Category'],
								attributes: ['id', 'name']
							}]
						},{
							model:model['CouponExcludedCategory'],
							attributes: ['id', 'coupon_id', 'category_id'],
							include:[{
								model:model['Category'],
								attributes: ['id', 'name']
							}]
						}],
				}).then(function(Coupons) {
					// console.log('Coupons',plainTextResponse(Coupons));
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
		});
}

function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}