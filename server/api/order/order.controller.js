'use strict';

const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
const ORDER_ITEM_STATUS = require('../../config/order-item-status');
const populate = require('../../utilities/populate')
var async = require('async');

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
	service.findAllRows('OrderItem', includeArr, refundObj, 0, null, field, order).then(function(result) {
		if (result) {
			return res.status(200).send(result.rows);
			} else {
				return res.status(200).send(err);
			}
		     });

}
