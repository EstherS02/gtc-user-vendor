'use strict';

const sequelize = require('sequelize');
const status = require('../../config/status');
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

export async function findAllVendorOrders(vendorId) {
	var result = {};

	try {
		const vendorOrdersResponse = await model['OrderVendor'].findAll({
			where: {
				vendor_id: vendorId
			},
			include: [{
				model: model['OrdersNew']
			}],
			group: ['id']
		});
		return vendorOrdersResponse;
	} catch (error) {
		console.log("findAllVendorOrders Error:::", error);
		return error;
	}
}

export async function findAllVendorOrdersOld(queryObj) {
	var result = {};

	try {
		const vendorOrdersResponse = await model['OrderVendor'].findAll({
			where: queryObj,
			include: [{
				model: model['OrdersNew'],
				attributes: ['id', 'user_id', 'invoice_id', 'purchase_order_id', 'po_number', 'total_price', 'ordered_date', 'status'],
				include: [{
					model: model['OrdersItemsNew'],
					attributes: [],
					include: [{
						model: model['Product'],
						where: queryObj,
						attributes: []
					}]
				}]
			}],
			attributes: ['id', 'order_id', 'vendor_id', 'status'],
			group: ['id']
		});
		const vendorOrders = await JSON.parse(JSON.stringify(vendorOrdersResponse));
		if (vendorOrders.length > 0) {
			const count = await model['OrderVendor'].count({
				where: queryObj
			});
			const sum = await model['OrderVendor'].sum('total_price', {
				where: queryObj,
			});
			result.count = count;
			result.sum = sum;
			result.rows = vendorOrders;
		} else {
			result.count = 0;
			result.rows = orders;
			result.total = 0;
		}
		return result;
	} catch (error) {
		console.log("findAllVendorOrders Error:::", error);
		return error;
	}
}

export async function userOrder(queryObj) {
	var order = {};
	const orderModelName = "OrdersNew";

	var includeArray = [{
		model: model['OrdersItemsNew'],
		attributes: ['id', 'order_id', 'product_id', 'quantity', 'price', 'shipping_cost', 'is_coupon_applied', 'coupon_id', 'coupon_amount', 'is_on_sale_item', 'discount_amount', 'order_item_status'],
		include: [{
			model: model['Product'],
			attributes: ['id', 'product_name', 'product_slug', 'marketplace_id', 'marketplace_type_id', 'vendor_id', 'price', 'moq', 'exclusive_sale', 'exclusive_start_date', 'exclusive_end_date', 'exclusive_offer'],
			include: [{
				model: model['Vendor'],
				attributes: ['id', 'vendor_name']
			}, {
				model: model['Category'],
				attributes: ['id', 'name']
			}, {
				model: model['SubCategory'],
				attributes: ['id', 'name', 'category_id']
			}, {
				model: model['Country'],
				attributes: ['id', 'name']
			}, {
				model: model["ProductMedia"],
				attributes: ['id', 'type', 'base_image', 'url'],
				where: {
					base_image: 1
				}
			}]
		}]
	}];

	try {
		const orderResponse = await model[orderModelName].findOne({
			where: queryObj,
			attributes: ['id', 'user_id', 'invoice_id', 'purchase_order_id', 'total_order_items', 'total_price', 'ordered_date', 'status'],
			include: includeArray
		});
		if (orderResponse) {
			var order = orderResponse.toJSON();
			order['marketplace_products'] = {};
			order['marketplace_summary'] = {};

			const marketplaceResponse = await model['Marketplace'].findAll({
				where: {
					status: status['ACTIVE']
				},
				attributes: ['id', 'name', 'code', 'status']
			});
			const marketplace = JSON.parse(JSON.stringify(marketplaceResponse));

			await Promise.all(order.OrdersItemsNews.map((aProduct) => {
				const index = marketplace.findIndex((obj) => obj.id == aProduct.Product.marketplace_id);
				const existsMarketplace = order['marketplace_products'].hasOwnProperty(marketplace[index].id);

				if (!existsMarketplace) {
					order['marketplace_summary'][marketplace[index].id] = {};
					order['marketplace_products'][marketplace[index].id] = {};

					order['marketplace_summary'][marketplace[index].id].sub_total = 0;
					order['marketplace_summary'][marketplace[index].id].shipping_ground = 0;
					order['marketplace_summary'][marketplace[index].id].total = 0;

					order['marketplace_products'][marketplace[index].id].count = 0;
					order['marketplace_products'][marketplace[index].id].products = [];
				}

				order['marketplace_summary'][aProduct.Product.marketplace_id].sub_total += parseFloat(aProduct.price);
				order['marketplace_summary'][aProduct.Product.marketplace_id].total = order['marketplace_summary'][aProduct.Product.marketplace_id].sub_total + order['marketplace_summary'][aProduct.Product.marketplace_id].shipping_ground;

				order['marketplace_products'][aProduct.Product.marketplace_id].count += 1;
				order['marketplace_products'][aProduct.Product.marketplace_id].products.push(aProduct);
			}));
			delete order.OrdersItemsNews;
			return order;
		} else {
			return null;
		}
	} catch (error) {
		return error;
	}
}