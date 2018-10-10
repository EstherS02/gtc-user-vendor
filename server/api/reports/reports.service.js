'use strict';

const moment = require('moment');
var _ = require('lodash');
const service = require('../service');
const status = require('../../config/status');
const model = require('../../sqldb/model-connect');

export async function AccountingReport(vendorID, queryParams) {
	var accounting = {};
	accounting['membership_expensive'] = 0;
	accounting['product_ad_expensive'] = 0;
	accounting['featured_product_expensive'] = 0;

	try {
		const memberShipExpensiveResponse = await model['VendorPlan'].findAll({
			include: [{
				model: model['Payment'],
				where: {
					status: status['ACTIVE']
				},
				attributes: ['id', 'amount']
			}],
			where: {
				vendor_id: vendorID,
				created_on: {
					'$gte': queryParams.start_date,
					'$lte': queryParams.end_date
				}
			},
			attributes: ['id', 'plan_id', 'vendor_id', 'payment_id']
		});
		const memberShipExpensive = await JSON.parse(JSON.stringify(memberShipExpensiveResponse));
		accounting['membership_expensive'] = await _.sumBy(memberShipExpensive, 'Payment.amount');

		const featuredProductExpensiveResponse = await model['FeaturedProduct'].findAll({
			include: [{
				model: model['Product'],
				where: {
					vendor_id: vendorID
				},
				attributes: []
			}, {
				model: model['Payment'],
				where: {
					status: status['ACTIVE']
				},
				attributes: ['id', 'amount']
			}],
			where: {
				created_on: {
					'$gte': queryParams.start_date,
					'$lte': queryParams.end_date
				}
			},
			attributes: ['id', 'product_id', 'payment_id']
		});
		const featuredProductExpensive = await JSON.parse(JSON.stringify(featuredProductExpensiveResponse));
		accounting['featured_product_expensive'] = await _.sumBy(featuredProductExpensive, 'Payment.amount');
		return accounting;
	} catch (error) {
		return error;
	}
}