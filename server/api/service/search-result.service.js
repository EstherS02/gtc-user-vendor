'use strict';

const async = require('async');
const sequelize = require('sequelize');
const status = require('../../config/status');
const model = require('../../sqldb/model-connect');
const config = require('../../config/environment');
const RawQueries = require('../../raw-queries/sql-queries');
const Sequelize_Instance = require('../../sqldb/index');

export async function categoryWithProductCount(productQueryObj, isFeaturedProduct) {
	var results = {};

	results['count'] = 0;
	results['rows'] = [];

	try {
		var categoriesResponse = await model['Category'].findAll({
			where: {
				status: status['ACTIVE']
			},
			attributes: ['id', 'name', 'code', 'description'],
			include: [{
				model: model['SubCategory'],
				attributes: ['id', 'category_id', 'name', 'code']
			}]
		});
		var categories = await JSON.parse(JSON.stringify(categoriesResponse));
		await Promise.all(categories.map(async (category, i) => {
			if (productQueryObj['product_category_id'] && (productQueryObj['product_category_id'] !== category.id)) {
				productQueryObj['product_category_id'] = await null;
			} else {
				productQueryObj['product_category_id'] = await category.id;
			}
			var productCount = await model['Product'].count({
				where: productQueryObj,
				include: [{
					model: model['FeaturedProduct'],
					where: {
						status: status['ACTIVE']
					},
					required: isFeaturedProduct
				}]
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

export async function countryWithProductCount(productQueryObj, isFeaturedProduct) {
	var results = {};

	results['count'] = 0;
	results['rows'] = [];

	try {
		var locationResponse = await model['Country'].findAll({
			where: {
				status: status['ACTIVE']
			},
			attributes: ['id', 'name', 'code', [sequelize.fn('count', sequelize.col('Products.id')), 'product_count']],
			include: [{
				model: model['Product'],
				where: productQueryObj,
				attributes: ['id'],
				include: [{
					model: model['FeaturedProduct'],
					where: {
						status: status['ACTIVE']
					},
					attributes: [],
					required: isFeaturedProduct
				}],
				required: false
			}],
			group: ['Country.id']
		});
		var countries = await JSON.parse(JSON.stringify(locationResponse));
		var productCount = await model['Product'].count({
			where: productQueryObj,
			include: [{
				model: model['FeaturedProduct'],
				where: {
					status: status['ACTIVE']
				},
				required: isFeaturedProduct
			}]
		});
		results['count'] = productCount;
		results['rows'] = countries;
		return results;
	} catch (error) {
		return error;
	}
}

export async function marketplacetypeWithProductCount(productQueryObj, isFeaturedProduct) {
	var results = {};

	results['count'] = 0;
	results['rows'] = [];

	try {
		var marketplaceTypeResponse = await model['MarketplaceType'].findAll({
			where: {
				status: status['ACTIVE']
			},
			attributes: ['id', 'name', 'code', [sequelize.fn('count', sequelize.col('Products.id')), 'product_count']],
			include: [{
				model: model['Product'],
				// where: productQueryObj,
				where:{
					status:1,
				},
				include: [{
					model: model['FeaturedProduct'],
					where: {
						status: status['ACTIVE']
					},
					attributes: [],
					required: isFeaturedProduct
				}],
				attributes: ['id'],
				required: false
			}],
			group: ['MarketplaceType.id']
		});
		var marketplaceTypes = await JSON.parse(JSON.stringify(marketplaceTypeResponse));
		var productCount = await model['Product'].count({
			where: productQueryObj,
			include: [{
				model: model['FeaturedProduct'],
				where: {
					status: status['ACTIVE']
				},
				required: isFeaturedProduct
			}]
		});
		results['count'] = productCount;
		results['rows'] = marketplaceTypes;
		return results;
	} catch (error) {
		return error;
	}
}

export async function productCountForCategoryAndSubcategory(productCountQueryParams) {
	return new Promise((resolve, reject) => {
		if (productCountQueryParams) {
			Sequelize_Instance.query(RawQueries.productCountBasedCategory(productCountQueryParams), {
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

export async function productCountForCountry(productCountQueryParams) {
	return new Promise((resolve, reject) => {
		if (productCountQueryParams) {
			Sequelize_Instance.query(RawQueries.productCountBasedCountry(productCountQueryParams), {
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

