'use strict';

var async = require('async');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const service = require('../service');
const status = require('../../config/status');
const orderItemStatus = require('../../config/order-item-new-status');
const ORDER_ITEM_STATUS = require('../../config/order-item-status');
const statusCode = require('../../config/status');
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

export async function dispatchOrder(req, res) {
	var bodyParams = {};
	var orderItemPromises = [];
	const orderId = req.params.orderId;
	const vendorId = req.user.Vendor.id;
	const shippingModelName = "Shipping";
	const orderVendorModelName = "OrderVendor";
	const orderItemModelName = "OrderItem";
	const agenda = require('../../app').get('agenda');

	req.checkBody('select_courier', 'Missing Query Param').notEmpty();
	req.checkBody('expected_delivery_date', 'Missing Query Param').notEmpty();
	req.checkBody('tracking_id', 'Missing Query Param').notEmpty();

	var errors = req.validationErrors();
	if (errors) {
		res.status(400).send('Missing Query Params');
		return;
	}

	var expectedDeliveryDate = new Date(req.body.expected_delivery_date);

	if (new Date() > expectedDeliveryDate) {
		return res.status(400).send("Invalid delivery date.");
	}

	bodyParams['provider_name'] = req.body.select_courier;
	bodyParams['tracking_id'] = req.body.tracking_id;
	bodyParams['status'] = status['ACTIVE'];
	bodyParams['created_on'] = new Date();
	bodyParams['created_by'] = req.user.first_name;

	var includeArray = [{
		model: model['Order'],
		attributes: ['id', 'user_id', 'ordered_date', 'status'],
		include: [{
			model: model['OrderItem'],
			attributes: ['id', 'order_id', 'product_id', 'order_item_status'],
			include: [{
				model: model['Product'],
				where: {
					vendor_id: vendorId
				},
				attributes: []
			}]
		}]
	}];

	try {
		const vendorOrder = await service.findOneRow(orderVendorModelName, {
			order_id: orderId,
			vendor_id: req.user.Vendor.id
		}, includeArray);
		if (vendorOrder) {
			for (let item of vendorOrder.Order.OrderItems) {
				if (item.order_item_status == orderItemStatus['ORDER_INITIATED']) {
					return res.status(400).send("Please confirm all items.");
				}
				if (item.order_item_status == orderItemStatus['CONFIRMED']) {
					orderItemPromises.push(service.updateRecordNew(orderItemModelName, {
						order_item_status: orderItemStatus['SHIPPED'],
						expected_delivery_date: expectedDeliveryDate,
						shipped_on: new Date(),
						last_updated_by: req.user.first_name,
						last_updated_on: new Date()
					}, {
						id: item.id,
						order_id: vendorOrder.Order.id
					}));
					agenda.now(config.jobs.orderNotification, {
						itemId: item.id,
						code: config.notification.templates.orderStatus,
					});
				}
			}

			if (Array.isArray(orderItemPromises) && orderItemPromises.length > 0) {
				const newShipping = await service.createRow(shippingModelName, bodyParams);
				const updateVendorOrder = await service.updateRecordNew(orderVendorModelName, {
					shipping_id: newShipping.id,
					dispatched_on: new Date(),
					last_updated_by: req.user.first_name,
					last_updated_on: new Date()
				}, {
					id: vendorOrder.id,
					order_id: vendorOrder.Order.id,
					vendor_id: vendorId
				});
				await Promise.all(orderItemPromises);
				return res.status(200).send(updateVendorOrder);
			} else {
				return res.status(404).send("Sorry!, there is no order items proceed to dispatch.");
			}
		} else {
			return res.status(404).send("Sorry!, there is no order items proceed to dispatch.");
		}
	} catch (error) {
		console.log("dispatchOrder Error:::", error);
		return res.status(500).send(error);
	}
}