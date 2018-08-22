'use strict';

const async = require('async');
const status = require('../../config/status');
const model = require('../../sqldb/model-connect');
const config = require('../../config/environment');

export async function categoriesWithProductCount(queryObj, productQueryObj) {
	var results = {};

	results['count'] = 0;
	results['rows'] = [];

	try {
		var categoriesResponse = await model['Category'].findAll({
			where: queryObj,
			attributes: ['id', 'name', 'code', 'description'],
			include: [{
				model: model['SubCategory'],
				attributes: ['id', 'category_id', 'name', 'code']
			}]
		});
		var categories = await JSON.parse(JSON.stringify(categoriesResponse));
		await Promise.all(categories.map(async (category, i) => {
			productQueryObj['product_category_id'] = category.id;
			var productCount = await model['Product'].count({
				where: productQueryObj
			});
			results['count'] += productCount;
			categories[i].product_count = productCount;
		}));
		results['rows'] = categories;
		return results;
	} catch (error) {
		return error;
	}
}