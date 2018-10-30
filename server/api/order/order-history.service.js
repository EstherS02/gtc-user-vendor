'use strict';

const sequelize = require('sequelize');
const model = require('../../sqldb/model-connect');

export async function findAllOrders(modelName, includeArr, queryObj, offset, limit, field, order) {
	var result = {};
	try {
		const ordersResponse = await model[modelName].findAll({
			include: includeArr,
			where: queryObj,
			offset: offset,
			limit: limit,
			order: [
				[field, order]
			]
		});
		const orders = await JSON.parse(JSON.stringify(ordersResponse));
		if (orders.length > 0) {
			const count = await model[modelName].count({
				where: queryObj
			});
			const sum = await model[modelName].sum('total_price', {
				where: queryObj
			});
			result.count = count;
			result.rows = orders;
			result.total = sum;
		} else {
			result.count = 0;
			result.rows = orders;
			result.total = 0;
		}
		return result;
	} catch (error) {
		return error;
	}
}