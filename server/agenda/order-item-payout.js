'use strict';

const _ = require('lodash');
const moment = require('moment');
const sequelize = require('sequelize');

const service = require('../api/service');
const config = require('../config/environment');
const status = require('../config/status');
const orderItemStatus = require('../config/order-item-new-status');
const paymentMethod = require('../config/payment-method');
const model = require('../sqldb/model-connect');

const stripe = require('../payment/stripe.payment');

module.exports = async function(job, done) {
	const paymentModelName = "Payment";
	const orderModelName = "Order";
	const orderItemPayoutModelName = "OrderItemPayout";
	const orderItemModelName = "OrderItem";
	const agenda = require('../app').get('agenda');

	try {
		const response = await model[orderItemModelName].findAll({
			where: {
				'$or': [{
					order_item_status: orderItemStatus['CANCELED'],
					cancelled_on: {
						//$gte: moment().subtract(config.payment.cancelOrderItem, 'days').startOf('day').utc().toDate(),
						$lte: moment().subtract(config.payment.cancelOrderItem, 'days').endOf('day').utc().toDate()
					}
				}, {
					order_item_status: orderItemStatus['VENDOR_CANCELED'],
					cancelled_on: {
						//$gte: moment().subtract(config.payment.cancelOrderItem, 'days').startOf('day').utc().toDate(),
						$lte: moment().subtract(config.payment.cancelOrderItem, 'days').endOf('day').utc().toDate()
					}
				}, {
					order_item_status: orderItemStatus['RETURN_RECIVED'],
					return_received_on: {
						//$gte: moment().subtract(config.payment.returnOrderItem, 'days').startOf('day').utc().toDate(),
						$lte: moment().subtract(config.payment.cancelOrderItem, 'days').endOf('day').utc().toDate()
					}
				}, {
					order_item_status: orderItemStatus['ORDER_INITIATED'],
					created_on: {
						$lte: moment().subtract(config.payment.noResposeOrderItem, 'days').endOf('day').utc().toDate()
					}
				}],
				'$OrderItemPayouts.order_item_id$': null
			},
			include: [{
				model: model[orderModelName],
				attributes: ['id', 'user_id', 'payment_id', 'status'],
				include: [{
					model: model[paymentModelName],
					attributes: ['id', 'date', 'amount', 'payment_response']
				}]
			}, {
				model: model[orderItemPayoutModelName],
				attributes: []
			}]
		});
		const cancelItems = JSON.parse(JSON.stringify(response));

		await Promise.all(cancelItems.map(async (item) => {
			
			var refundAmt = item.price;
			if(item.coupon_amount){
				refundAmt = refundAmt - item.coupon_amount;
			}

			const chargedPaymentRes = await JSON.parse(item.Order.Payment.payment_response);
			const refundResponse = await stripe.refundCustomerCard(chargedPaymentRes.id, refundAmt);

			const newPayment = await service.createRow(paymentModelName, {
				date: new Date(refundResponse.created * 1000),
				amount: refundResponse.amount / 100.0,
				payment_method: paymentMethod['STRIPE'],
				status: status['ACTIVE'],
				payment_response: JSON.stringify(refundResponse),
				created_by: "Administrator",
				created_on: new Date()
			});

			if (item.order_item_status == orderItemStatus['ORDER_INITIATED']) {
				const updateOrderItemRow = await service.updateRow(orderItemModelName, {
					order_item_status: orderItemStatus['AUTO_CANCELED'],
					reason_for_cancel:  "Vendor confirmation excedded.",
					cancelled_on: new Date(),
					last_updated_by: "Administrator",
					last_updated_on: new Date()
				}, item.id);

			/*	agenda.now(config.jobs.orderNotification, {
					itemId: item.id,
					code: config.notification.templates.orderItemCancelled,
				});*/
			}

			if(newPayment){
				const updateRefundStatus = await service.updateRow(orderItemModelName, {
					is_refunded:  1,
					last_updated_by: "Administrator",
					last_updated_on: new Date()
				}, item.id);
			}
					
			const orderItemPayoutResponse = await service.createRow(orderItemPayoutModelName, {
				order_item_id: item.id,
				payment_id: newPayment.id,
				status: status['ACTIVE'],
				created_by: "Administrator",
				created_on: new Date()
			});
		}));
		done();
	} catch (error) {
		console.log("orderItemPayout Error:::", error);
		return error;
	}
}