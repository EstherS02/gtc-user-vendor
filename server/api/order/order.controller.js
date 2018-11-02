'use strict';

var async = require('async');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
const status = require('../../config/status');
const ORDER_ITEM_STATUS = require('../../config/order-item-status');
const populate = require('../../utilities/populate')
const orderService = require('./order.service');

export function orderItemdetails(req, res) {
	var refundObj = {};
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

export function dispatchOrder(req, res) {
	var bodyParams = {};
	const orderId = req.params.orderId;
	const vendorId = req.user.Vendor.id;

	req.checkBody('select_courier', 'Missing Query Param').notEmpty();
	req.checkBody('expected_delivery_date', 'Missing Query Param').notEmpty();
	req.checkBody('tracking_id', 'Missing Query Param').notEmpty();

	var errors = req.validationErrors();
	if (errors) {
		res.status(400).send('Missing Query Params');
		return;
	}

	if (new Date() > new Date(req.body.expected_delivery_date)) {
		return res.status(400).send("Invalid delivery date.");
	}

	var expectedDeliveryDate = new Date(req.body.expected_delivery_date);

	bodyParams['provider_name'] = req.body.select_courier;
	bodyParams['tracking_id'] = req.body.tracking_id;
	bodyParams['status'] = status['ACTIVE'];
	bodyParams['created_on'] = new Date();
	bodyParams['created_by'] = req.user.first_name;

	orderService.dispatchOrder(req, orderId, vendorId, expectedDeliveryDate, bodyParams)
		.then((response) => {
			return res.status(response.statusCode).send(response.data);
		})
		.catch((error) => {
			console.log("dispatchOrder Error:::", error);
			return res.status(500).send(error);
		});
}