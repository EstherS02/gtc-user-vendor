'use strict';

var async = require("async");
const moment = require('moment');
const sequelize = require('sequelize');
const service = require('../service');
const status = require('../../config/status');
const orderItemStatus = require('../../config/order-item-new-status');
const marketplace = require('../../config/marketplace');
const Sequelize_Instance = require('../../sqldb/index');
const RawQueries = require('../../raw-queries/sql-queries');
const roles = require('../../config/roles');
const model = require('../../sqldb/model-connect');

export function orderVendorFollowers(modelName, querObj, includeArray, groupBy) {
	return new Promise((resolve, reject) => {
		model[modelName].findAll({
			where: querObj,
			include: includeArray,
			group: [groupBy]
		}).then((rows) => {
			const response = JSON.parse(JSON.stringify(rows));
			return resolve(response);
		}).catch((error) => {
			return reject(error);
		});
	});
}

export async function vendorCountByCountry(params) {
	return new Promise((resolve, reject) => {
		if (params) {
			Sequelize_Instance.query(RawQueries.countryCountForVendor(params), {
				model: model['Country'],
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

export async function vendorCountByMarketplace(params) {
	return new Promise((resolve, reject) => {
		Sequelize_Instance.query(RawQueries.vendorCountByMarkerplace(params), {
			model: model['Marketplace'],
			type: Sequelize_Instance.QueryTypes.SELECT
		}).then((results) => {
			resolve(results)
		}).catch(function(error) {
			reject(error);
		});
	});
}

export async function vendorCountByCountryForHome() {
	return new Promise((resolve, reject) => {
		Sequelize_Instance.query(RawQueries.countryCountForVendorHomepage(), {
			model: model['Country'],
			type: Sequelize_Instance.QueryTypes.SELECT
		}).then((results) => {
			resolve(results)
		}).catch(function(error) {
			reject(error);
		});
	});
}

//vendor profile page
export async function vendorProductCountForFilter(params) {
	return new Promise((resolve, reject) => {
		if (params) {
			Sequelize_Instance.query(RawQueries.vendorFilterCatogoryCount(params), {
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

export async function TopSellingVendors(offset, limit, marketplace) {
	var orderModelName = "Order";
	var vendorModelName = "Vendor";
	var countryModelName = "Country";
	var productModelName = "Product";
	var orderItemModelName = "OrderItem";
	var vendorPlanModelName = "VendorPlan";
	var orderVendorModelName = "OrderVendor";
	var vendorRatingModelName = "VendorRating";

	var includeArray = [{
		model: model[vendorPlanModelName],
		attributes: [],
		where: {
			status: status['ACTIVE'],
			start_date: {
				'$lte': moment().format('YYYY-MM-DD')
			},
			end_date: {
				'$gte': moment().format('YYYY-MM-DD')
			}
		}
	}, {
		model: model[orderVendorModelName],
		attributes: [],
		include: [{
			model: model[orderModelName],
			attributes: [],
			include: [{
				model: model[orderItemModelName],
				attributes: [],
				where: {
					'$or': [{
						order_item_status: orderItemStatus['DELIVERED']
					}, {
						order_item_status: orderItemStatus['COMPLETED']
					}]
				},
				include: [{
					model: model[productModelName],
					attributes: [],
					where: {
						marketplace_id: marketplace
					}
				}]
			}]
		}]
	}, {
		model: model[countryModelName],
		attributes: ['id', 'name']
	}, {
		model: model[vendorRatingModelName],
		attributes: []
	}];

	try {
		const vendorResponse = await model[vendorModelName].findAll({
			where: {
				status: status['ACTIVE'],
				id: {
					$col: 'OrderVendors->Order->OrderItems->Product.vendor_id'
				}
			},
			attributes: ['id', 'vendor_name', 'vendor_profile_pic_url', [sequelize.fn('SUM', sequelize.col('OrderVendors->Order->OrderItems.quantity')), 'sales_count'],
				[sequelize.literal('(SUM(VendorRatings.rating) / COUNT(VendorRatings.user_id))'), 'vendor_rating']
			],
			include: includeArray,
			subQuery: false,
			offset: offset,
			limit: limit,
			order: sequelize.literal('sales_count DESC'),
			group: ['OrderVendors->Order->OrderItems.id']
		});
		const vendors = JSON.parse(JSON.stringify(vendorResponse));
		await Promise.all(vendors.map(async (vendor) => {
			vendor['products_count'] = await service.countRows(productModelName, {
				vendor_id: vendor.id,
				marketplace_id: marketplace,
				status: status['ACTIVE']
			});
			vendor['exclusive_product_sale'] = await service.countRows(productModelName, {
				vendor_id: vendor.id,
				marketplace_id: marketplace,
				status: status['ACTIVE'],
				exclusive_sale: 1,
				exclusive_start_date: {
					'$lte': new Date()
				},
				exclusive_end_date: {
					'$gte': new Date()
				}
			});
		}));
		return vendors;
	} catch (error) {
		console.log("TopSellingVendors Error:::", error);
		return error;
	}
}
// Active vendor Counts
export function activeVendorcounts(params) {
	return new Promise((resolve, reject) => {
		if (params) {
			Sequelize_Instance.query(RawQueries.activeVendorcountsQuery(params), {
				model: model['product'],
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