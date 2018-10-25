'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
const ORDER_ITEM_STATUS = require('../../config/order-item-status');
const statusCode = require('../../config/status');
const populate = require('../../utilities/populate')
var async = require('async');
const _ = require('lodash');

export function orderItemdetails(req, res) {
	var refundObj ={};
	var paramsID = req.params.id;
	let includeArr = populate.populateData('Product,Product.ProductMedia,Product.Vendor,Product.Vendor.User,Order');
	refundObj = {
		order_id: req.params.id,
		order_item_status: {
		 	$ne: ORDER_ITEM_STATUS['ORDER_CANCELLED_AND_REFUND_INITIATED']
		 },
	};
	var field = 'created_on';
	var order = "asc";
	service.findAllRows('OrderItem', includeArr, refundObj, 0, null, field, order)
		.then(function(result) {
			if (result) {
				return res.status(200).send(result.rows);
				} else {
					return res.status(200).send(null);
				}
		}).catch(function(error){
			console.log("Error::",error);
		})
}

export function subscriptionOrder(req,res){

	var subscriptionOrderIncludeArr = [];
	var subscriptionQueryObj = {};
	var limit, offset, field, order;

	offset = req.query.offset ? parseInt(req.query.offset) : null;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : null;
	delete req.query.limit;
	field = req.query.field ? req.query.field : "id";
	delete req.query.field;
	order = req.query.order ? req.query.order : "asc";
	delete req.query.order;	

	subscriptionOrderIncludeArr = [
		{
			model: model['User'],
			attributes:['id', 'first_name'],
		},
		{
			model: model['Product'],
			attributes:['id', 'product_name', 'sku', 'vendor_id'],
			include:[
				{
					model: model['Vendor'],
					attributes:['id', 'vendor_name'],
				}]
		}]

	if (!req.query.status) {
		subscriptionQueryObj['status'] = {
			'$ne': statusCode["DELETED"]
		}
	}else{
		subscriptionQueryObj['status'] = req.query.status;
	}

	service.findAllRows('Subscription', subscriptionOrderIncludeArr, subscriptionQueryObj, offset, limit, field, order)
		.then(function(subscriptions) {
			if (subscriptions) {
				var subscriptionPromise = [];

				_.forOwn(subscriptions.rows, function(eachSubscription) {

					subscriptionPromise.push(subscriptionSalesCount(eachSubscription));
				});
				return Promise.all(subscriptionPromise)
				.then(function(subscriptionRows){
					subscriptions.rows = subscriptionRows;
					return res.status(200).send(subscriptions);
				}).catch(function(error){
					return res.status(400).send(error);
				})
			} else {
				return res.status(200).send(null);
			}
		}).catch(function(error){
			console.log("Error::",error);
			return res.status(400).send(error);
		});
}

function subscriptionSalesCount(eachSubscription){
	var subscriptionCountIncludeArr = [], subscriptionCountQueryObj = {};
	subscriptionCountIncludeArr = [{
					model:model['OrderItem'],
					where:{
						product_id: eachSubscription.product_id
					}
				}]
	subscriptionCountQueryObj = {
		user_id: eachSubscription.user_id
	}
	return service.countRows('Order', subscriptionCountQueryObj, subscriptionCountIncludeArr)
		.then(function(salesCount) {
			if (salesCount) {
				eachSubscription.sales = salesCount;
			} else {
				eachSubscription.sales = 0;
			}
			return Promise.resolve(eachSubscription);
		}).catch(function(error){
			console.log("Error::",error);
			return Promise.reject(error);
		});		
}
