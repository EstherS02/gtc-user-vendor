'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const reference = require('../../config/model-reference');
const statusCode = require('../../config/status');
const service = require('../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');
import series from 'async/series';
var async = require('async');

export function wishlist(req, res){
if (req.query.sort == 'rating') {
		var field = req.query.sort;
	} else {
		var field = 'id';
	}
	var order = "desc"; //"asc"
	var offset = 0;
	var limit = 10;
	var vendor_id = 29;
	var rating_limit = 120;
	var queryObj = {};
	queryObj={
				// vendor_id: 29,
				user_id : 62
			};

	async.series({
			wishlist: function(callback) {
				model['WishList'].findAndCountAll({
					where: queryObj,
					offset: offset,
					limit: limit,
					attributes: ['id','product_id','user_id','status'],
					order: [
						[field, order]
					],
					include: [{
						model: model['Product'],
						attributes:['id','product_name'],
						include:[{
							model:model['ProductMedia'],
							attributes:['url']
						}]
					},{
						model:model['User'],
						attributes:['id','first_name','last_name']
					}]
					// ,
					// plain: true
				}).then(function(wishlist) {
					console.log('wishlist',wishlist.rows);
					// console.log('Wishlist',plainTextRsponse(wishlist))
					return callback(null, wishlist);
				}).catch(function(error) {
					console.log('Error :::', error);
					return callback(null);
				});
			}
		},
		function(err, results) {
			if (!err) {
				res.render('wishlist', {
					title: "Global Trade Connect",
					wishlist: results.wishlist.rows,
					count: results.wishlist.count
				});
			} else {
				res.render('wishlist', err);
			}
		});

	 // res.render('wishlist', {
  //               title: "Global Trade Connect",
  //           });
}

function plainTextResponse(response) {
	return response.get({
		plain: true
	});
}