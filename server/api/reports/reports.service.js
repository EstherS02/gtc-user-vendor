'use strict';

const moment = require('moment');
var _ = require('lodash');
const service = require('../service');
const status = require('../../config/status');
const model = require('../../sqldb/model-connect');
const sequelize = require('sequelize');

export async function AccountingReport(vendorID, queryParams) {
	var accounting = {};
	accounting['membership'] = 0;
	accounting['featured_product'] = 0;
	accounting['processing_fees'] = 0;
	accounting['subscription_fees'] = 0;
	accounting['payment_in_escrow'] = 0;

	var queryObj = {};
	queryObj.created_on = {};
	
	var adminQueryObj = {};

	try {
		if (vendorID) {
			queryObj.vendor_id = vendorID;
			adminQueryObj.vendor_id = vendorID;
		}

		if (queryParams.start_date && queryParams.end_date) {
			queryObj.created_on['$gte'] = queryParams.start_date;
			queryObj.created_on['$lte'] = queryParams.end_date;
		}

		const memberShipExpensiveResponse = await model['VendorPlan'].findAll({
			include: [{
				model: model['Payment'],
				where: {
					status: status['ACTIVE']
				},
				attributes: ['id', 'amount']
			}],
			where: queryObj,
			attributes: ['id', 'plan_id', 'vendor_id', 'payment_id']
		});
		const memberShipExpensive = await JSON.parse(JSON.stringify(memberShipExpensiveResponse));
		accounting['membership'] = await parseFloat(_.sumBy(memberShipExpensive, 'Payment.amount'));

		const featuredProductExpensiveResponse = await model['FeaturedProduct'].findAll({
			include: [{
				model: model['Product'],
				where: adminQueryObj,
				attributes: []
			}, {
				model: model['Payment'],
				where: {
					status: status['ACTIVE']
				},
				attributes: ['id', 'amount']
			}],
			where: {
				created_on: queryObj.created_on
			},
			attributes: ['id', 'product_id', 'payment_id']
		});
		const featuredProductExpensive = await JSON.parse(JSON.stringify(featuredProductExpensiveResponse));
		accounting['featured_product'] = await parseFloat(_.sumBy(featuredProductExpensive, 'Payment.amount'));

		const processingFees = await model['OrderVendor'].findAll({
			raw: true,
			where: queryObj,
			attributes: [
				[sequelize.fn('sum', sequelize.col('gtc_fees')), 'amount']
			]
		});
		if ( processingFees.length > 0 )
			accounting['processing_fees'] = processingFees[0].amount != null ? parseFloat(processingFees[0].amount) : 0;

		const subscriptionFees = await model['OrderVendor'].findAll({
			raw: true,
			where: queryObj,
			attributes: [
				[sequelize.fn('sum', sequelize.col('plan_fees')), 'amount']
			]
		});
		if (subscriptionFees.length > 0) 
			accounting['subscription_fees'] = subscriptionFees[0].amount != null ? parseFloat(subscriptionFees[0].amount) : 0;

		
		const paymentInEscrow = await model['OrderVendor'].findAll({
			raw: true,
			where: queryObj,
			attributes: [
				[sequelize.fn('sum', sequelize.col('final_price')), 'amount']
			]
		});
		if (subscriptionFees.length > 0)
			accounting['payment_in_escrow'] = paymentInEscrow[0].amount != null ? parseFloat(paymentInEscrow[0].amount) : 0;


		/*const gtcPaymentEscrow = await model['OrderVendor'].findAll({
			raw: true,
			where: queryObj,
			attributes: [
				[sequelize.fn('sum', sequelize.col('gtc_fees')), 'amount']
			]
		});
		accounting['gtc_pay_escrow_fees'] = gtcPaymentEscrow.length > 0 ? gtcPaymentEscrow[0].amount : 0;*/

		adminQueryObj.created_on = queryObj.created_on;

		const gtcPaymentEscrow = await model['OrderVendor'].findAll({
			raw: true,
			where: adminQueryObj,
			attributes: [],
			include: [{
				model: model['OrderVendorPayout'],
				where: {},
				attributes: [],
				include: [{
					model: model['Payment'],
					where: {},
					attributes: [[sequelize.fn('sum', sequelize.col('amount')), 'amount']]
				}]
			}]
		});		
		if(!_.isUndefined(gtcPaymentEscrow['OrderVendorPayouts.Payment.amount']))
			accounting['gtc_pay_escrow'] = parseFloat(gtcPaymentEscrow['OrderVendorPayouts.Payment.amount']);
		else
			accounting['gtc_pay_escrow'] = 0;

		accounting['total'] = _.sum(Object.values(accounting));
		delete adminQueryObj.created_on;
		return accounting;
	} catch (error) {
		return error;
	}
}