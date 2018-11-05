'use strict';

const _ = require('lodash');
const moment = require('moment');
const sequelize = require('sequelize');
const service = require('../api/service');
const status = require('../config/status');
const config = require('../config/environment');
const model = require('../sqldb/model-connect');
const stripe = require('../payment/stripe.payment');
const paymentMethod = require('../config/payment-method');
const orderItemStatus = require('../config/order-item-new-status');

module.exports = async function(job, done) {
	console.log("noresponse oredr item agenda job");
	const paymentModelName = "Payment";
	const orderModelName = "OrdersNew";
	const orderItemPayoutModelName = "OrderItemPayout";
	const orderItemModelName = "OrdersItemsNew";

	try {
		const response = await model[orderItemModelName].findAll({
			where: {
				'$or': [{
					order_item_status: orderItemStatus['ORDER_INITIATED'],
					created_on: {
						$lte: moment().subtract(config.payment.noresposeOrderItem, 'days').endOf('day').utc().toDate()
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

		const autoCancelItem = JSON.parse(JSON.stringify(response));

		await Promise.all(autoCancelItem.map(async (item) => {
			const refundAmt = item.price;
			const chargedPaymentRes = await JSON.parse(item.OrdersNew.Payment.payment_response);
			const refundResponse = await stripe.refundCustomerCard(chargedPaymentRes.id, refundAmt);

			const newPayment = await service.createRow(paymentModelName, {
				date: new Date(refundResponse.created),
				amount: refundResponse.amount / 100.0,
				payment_method: paymentMethod['STRIPE'],
				status: status['ACTIVE'],
				payment_response: JSON.stringify(refundResponse),
				created_by: "Administrator",
				created_on: new Date()
			});

			const updateOrderItemRow = await service.updateRow(orderItemModelName, {
				order_item_status: orderItemStatus['AUTO_CANCELED'],
				cancelled_on: new Date(),
				last_updated_by: "Administrator",
				last_updated_on: new Date()
			}, item.id);

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
		console.log("noresponse order item cancel Error:::", error);
		return error;
	}
};