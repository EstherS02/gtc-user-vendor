'use strict';

const service = require('../../api/service');
const sequelize = require('sequelize');
const moment = require('moment');
const populate = require('../../utilities/populate');
var async = require('async');

export function refund(req, res) {
    
var itemModel="OrderItem";
var searchObj = {},LoggedInUser = {};
var productIncludeArr = [];
var offset, limit, field, order;
offset = 0;
limit = null;
field = "id";
order = "asc";

if (req.user)
 LoggedInUser = req.user;

var productIncludeArr =[{
	model:model['Product'],
	include: [{
		model: model['ProductMedia'],
		attribute:['url']
	}]
}] 
// populate.populateData('Product,Product.ProductMedia,Product.Vendor,Product.Category,
	// Product.SubCategory,Order,Order.User');

if (req.params.id)
 searchObj["id"] = req.params.id;

    async.series({
		item: function (callback) {
        	service.findOneRow(itemModel, searchObj, productIncludeArr)
				.then(function (item) {
					return callback(null, item);

				}).catch(function (error) {
					console.log('Error :::', error);
					return callback(null);
				});
		},
    }, function (err, results) {
    	console.log(results.item.Order);
		if (!err) {
			res.render('refund', {
				title: "Global Trade Connect",
				item: results.item,
				LoggedInUser: LoggedInUser
			});
		}
		else {
			res.render('refund', err);
		}
	});
}