'use strict';

const async = require('async');
const sequelize = require('sequelize');
const status = require('../../config/status');
const model = require('../../sqldb/model-connect');
const config = require('../../config/environment');
const RawQueries = require('../../raw-queries/sql-queries');
const Sequelize_Instance = require('../../sqldb/index');

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

export async function productViewCategoryProductCount(queryObj, productQueryObj){
	return new Promise((resolve, reject) => {
		if (queryObj && productQueryObj ) {
			Sequelize_Instance.query(RawQueries.productViewAndReviewCategoryCount(queryObj, productQueryObj), {
				model: model['Product'],
				type: Sequelize_Instance.QueryTypes.SELECT
			}).then((results) => {
				resolve(results)
			}).catch(function(error) {
				reject(error);
			});
		} else {
			resolve()
		}
	});
}