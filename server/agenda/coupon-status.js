'use strict';

const _ = require('lodash');
const moment = require('moment');
const sequelize = require('sequelize');
const service = require('../api/service');
const status = require('../config/status');
const statusCode = require('../config/status');
const model = require('../sqldb/model-connect');
const config = require('../config/environment');

module.exports = async function(job, done) {
	console.log("coupon status inactive*************");
	const couponModelName = "Coupon";
	try {
		const response = await model[couponModelName].findAll({
			where: {
				status: statusCode["ACTIVE"],
				expiry_date: {
					$lte: moment().format('YYYY-MM-DD')
				}
			}
		});
		const couponResponse = JSON.parse(JSON.stringify(response));
		await Promise.all(couponResponse.map(async (coupon) => {
			await service.updateRecord(couponModelName, {
				status: statusCode["INACTIVE"],
				last_updated_on: new Date(),
				last_updated_by: "Administrator"
			}, {
				id: coupon.id
			})
		}));
		done();
	} catch (error) {
		console.log("vendorPayout Error:::", error);
		return error;
	}
};