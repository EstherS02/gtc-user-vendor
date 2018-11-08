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
	const orderItemModelName = "OrderItem";
	const orderVendorModelName = "OrderVendor";
	const vendorModelName = "Vendor";
	const orderVendorPayout = "OrderVendorPayout";


	try {
		const response = await model[orderVendorModelName].findAll({
			where: {
				status: statusCode["ACTIVE"],
				dispatched_on: {
					$lte: moment().subtract(config.payment.vendorPayout, 'days').endOf('day').utc().toDate()
				}
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
			}]
		});

		const vendorPayouts = JSON.parse(JSON.stringify(response));

		await Promise.all(vendorPayouts.map(async (item) => {

			console.log("item..................",item);

		}));



	} catch (error) {
		console.log("vendorPayout Error:::", error);
		return error;
	}
};