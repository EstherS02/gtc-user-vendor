'use strict';

const _ = require('lodash');
const moment = require('moment');
const sequelize = require('sequelize');
const service = require('../api/service');
const status = require('../config/status');
const statusCode = require('../config/status');
const model = require('../sqldb/model-connect');
const config = require('../config/environment');
const stripe = require('../payment/stripe.payment');
const paymentMethod = require('../config/payment-method');
const orderItemStatus = require('../config/order-item-new-status');

module.exports = async function(job, done) {
	console.log("agenda job for vendor payouts*************");

	const paymentModelName = "Payment";
	const orderModelName = "Order";
	const orderVendorModelName = "OrderVendor";
	const vendorModelName = "Vendor";
	const orderVendorPayoutModelName = "OrderVendorPayout";

	try {
		const response = await model[orderVendorModelName].findAll({
			where: {
				status: statusCode["ACTIVE"],
				dispatched_on: {
					$lte: moment().subtract(config.payment.vendorPayout, 'days').endOf('day').utc().toDate()
				},
			   '$OrderVendorPayouts.order_vendor_id$': null
			},
			include: [{
				model: model[orderModelName],
				attributes: ['id', 'user_id', 'payment_id', 'status'],
				include: [{
					model: model[paymentModelName],
					attributes: ['id', 'date', 'amount', 'payment_response']
				}]
			}, {
				model: model[vendorModelName],
				attributes: ['id', 'vendor_payout_stripe_id', 'vendor_payout_paypal_email']
			}, {
				model: model[orderVendorPayoutModelName],
				attributes: []
			}]
		});

		const vendorPayouts = JSON.parse(JSON.stringify(response));

		await Promise.all(vendorPayouts.map(async (item) => {
			if ((item.Vendor.vendor_payout_stripe_id != null) || (item.Vendor.vendor_payout_paypal_email != null)) {
				const vendorAmt = Math.round(item.final_price * 100);
				const currency = config.order.currency;
				const orderId = item.order_id;
				var vendorResponse, paymentMethodType;

				if (item.Vendor.vendor_payout_stripe_id != null) {
					paymentMethodType = paymentMethod['STRIPE'];
					vendorResponse = await stripe.vendorStripePayout(vendorAmt, currency, item.Vendor.vendor_payout_stripe_id, orderId)
				} else if (item.Vendor.vendor_payout_paypal_email != null) {
					paymentMethodType = paymentMethod['PAYPAL'];
					vendorResponse = await stripe.vendorPaypalPayout('EMAIL', vendorAmt, 'CAD', item.Vendor.vendor_payout_paypal_email, orderId)
				}

				if (vendorResponse) {

					const newPayment = await service.createRow(paymentModelName, {
						date: new Date(),
						amount: vendorAmt / 100.0,
						payment_method: paymentMethodType,
						status: status['ACTIVE'],
						payment_response: JSON.stringify(vendorResponse),
						created_by: "Administrator",
						created_on: new Date()
					});

					const orderVendorPayoutResponse = await service.createRow(orderVendorPayoutModelName, {
						order_vendor_id: item.id,
						payment_id: newPayment.id,
						status: status['ACTIVE'],
						created_by: "Administrator",
						created_on: new Date()
					});
				}
			}
		}));
		done();
	} catch (error) {
		console.log("vendorPayout Error:::", error);
		return error;
	}
};