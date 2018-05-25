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
	var	limit = 10;//;
	var queryObj =  {};
	if(typeof req.query.limit !== 'undefined'){
		limit = req.query.limit;
		limit = parseInt(limit);
	}
	if(typeof req.query.status !== 'undefined'){
		var status= '';
		 if( status = statusCode[req.query.status])
		 queryObj['status'] = parseInt(status);
	}

	queryObj['created_by']= created_by;
	async.series({
			Coupons: function(callback) {
				model['Coupon'].findAndCountAll({
					where:queryObj,
					offset: offset,
					limit: limit,
					order: [
						[field, order]
					],
					raw:true
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
