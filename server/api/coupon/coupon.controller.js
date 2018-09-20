'use strict';

var async = require('async');
const moment = require('moment');
const crypto = require('crypto');
const uuid = require('node-uuid');
const expressValidator = require('express-validator');
const config = require('../../config/environment');
const model = require('../../sqldb/model-connect');
const status = require('../../config/status');
const service = require('../service');

export function updateCoupon(req, res) {
	var modelName = 'Coupon';
	var newCoupon = {};
	var id = req.body.id;
	newCoupon = req.body;

	var queryObj = {};
	var includeArr = [];

	service.updateRow(modelName, newCoupon, id).then(function(results) {
		if (results) {
			updateProductCoupon(JSON.parse(req.body.products));
			updateProductCoupon(JSON.parse(req.body.excludeProduct));
			updateCategoryCoupon(JSON.parse(req.body.categories));
			updateCategoryCoupon(JSON.parse(req.body.excludeCategories));
			return res.status(200).send(results);
		} else {
			return res.status(404).send("Not found");
		}
	}).catch(function(error) {
		console.log('Error:::', error);
		res.status(500).send("Internal server error");
		return;
	});
}

function updateProductCoupon(req) {
	var id = req.id;
	var newCouponArry = (req.couponArray);
	var modelName = req.modelName;
	model[modelName].update({
		status: 0
	}, {
		where: {
			coupon_id: id
		}
	}).then(function(row) {
		console.log("updateProductCoupon", row);
		if (newCouponArry) {

			newCouponArry.forEach(function(element) {
				console.log('new', element);
				var data = {};
				var queryObj = {};
				var includeArr = [];
				data = {
					coupon_id: id,
					product_id: element,
					status: 1
				};
				queryObj = {
					coupon_id: id,
					product_id: element
				};
				service.findOneRow(modelName, queryObj, includeArr)
					.then(function(results) {
						if (results) {
							var id = results.id;
							data.last_updated_on = new Date();
							service.updateRow(modelName, data, id).then(function(response) {
								return;
							});
						} else {
							data.created_on = new Date();
							service.createRow(modelName, data).then(function(response) {
								return;
							});
						}
					});
			});

		}
		return;
	});
}

function updateCategoryCoupon(req) {
	var id = req.id;
	var newCouponArry = (req.couponArray);
	var modelName = req.modelName;
	model[modelName].update({
		status: 0
	}, {
		where: {
			coupon_id: id
		}
	}).then(function(row) {
		console.log("updateProductCoupon", row);
		if (newCouponArry) {
			newCouponArry.forEach(function(element) {
				console.log('new', element);
				var data = {};
				var queryObj = {};
				var includeArr = [];
				data = {
					coupon_id: id,
					category_id: element,
					status: 1
				};
				queryObj = {
					coupon_id: id,
					category_id: element
				};
				service.findOneRow(modelName, queryObj, includeArr)
					.then(function(results) {
						if (results) {
							var id = results.id;
							data.last_updated_on = new Date();
							service.updateRow(modelName, data, id).then(function(response) {
								return;
							});
						} else {
							data.created_on = new Date();
							service.createRow(modelName, data).then(function(response) {
								return;
							});
						}
					});
			});
		}
		return;
	});
}

export function updateStatus(req, res) {
	var status1 = req.body.status;
	var ids = JSON.parse(req.body.ids)
	var modelName = 'Coupon';
	var bodyParams = {
		status: status[status1],
		last_updated_on: new Date()
	}

	service.updateRow(modelName, bodyParams, ids).then(function(response) {
		return res.status(200).send("success");
	}).catch(function(error) {
		console.log("Coupon status update:::", error)
		return res.status(500).send("error");
	})
	return res.status(200).send(req.body.data)
}

export async function saveCoupon(req, res) {
	var queryObj = {};
	var bodyParams = {};
	var couponProducts = [];
	var couponCategories = [];
	var excludeCouponProducts = [];
	var excludeCouponCategories = [];
	const audit = req.user.first_name;
	const couponModelName = "Coupon";
	const couponProductModelName = "CouponProduct";
	const couponExcludedProductModelName = "CouponExcludedProduct";
	const couponCategoryModelName = "CouponCategory";
	const couponExcludedCategoryModelName = "CouponExcludedCategory";

	req.checkBody('coupon_name', 'Missing Query Param').notEmpty();
	req.checkBody('code', 'Missing Query Param').notEmpty();
	req.checkBody('discount_type', 'Missing Query Param').notEmpty();
	req.checkBody('discount_value', 'Missing Query Param').notEmpty();
	req.checkBody('expiry_date', 'Missing Query Param').notEmpty();

	var errors = req.validationErrors();
	if (errors) {
		res.status(400).send('Missing Query Params');
		return;
	}

	couponProducts = req.body.products;
	delete req.body.products;
	excludeCouponProducts = req.body.exclude_products;
	delete req.body.exclude_products;
	couponCategories = req.body.categories;
	delete req.body.categories;
	excludeCouponCategories = req.body.exclude_categories;
	delete req.body.exclude_categories;

	if (req.body.id) {
		queryObj['id'] = req.body.id;
	}

	bodyParams['coupon_name'] = req.body.coupon_name;
	bodyParams['code'] = req.body.code;
	bodyParams['discount_type'] = parseInt(req.body.discount_type);
	bodyParams['discount_value'] = parseFloat(req.body.discount_value);
	bodyParams['individual_use_only'] = parseFloat(req.body.individual_use_only);
	bodyParams['excluse_sale_item'] = parseFloat(req.body.excluse_sale_item);
	bodyParams['expiry_date'] = req.body.expiry_date;
	bodyParams['minimum_spend'] = req.body.minimum_spend ? parseFloat(req.body.minimum_spend) : null;
	bodyParams['maximum_spend'] = req.body.maximum_spend ? parseFloat(req.body.maximum_spend) : null;
	bodyParams['usage_limit'] = req.body.usage_limit ? parseInt(req.body.usage_limit) : null;
	bodyParams['status'] = parseInt(req.body.status);
	bodyParams['limit_usage_to_x_items'] = req.body.limit_usage_to_x_items ? parseInt(req.body.limit_usage_to_x_items) : null;
	bodyParams['usage_limit_per_user'] = req.body.usage_limit_per_user ? parseInt(req.body.usage_limit_per_user) : null;
	bodyParams['publish_date'] = new Date();
	bodyParams['vendor_id'] = req.user.Vendor.id;

	const currentDate = moment().format('YYYY-MM-DD');
	const expiryDate = moment(bodyParams['expiry_date']).format('YYYY-MM-DD');
	if (expiryDate < currentDate) {
		return res.status(400).send('Invalid expiry date');
	}

	try {
		const couponResponse = await service.upsertRow(couponModelName, bodyParams, queryObj, audit);
		const coupon = await couponResponse.toJSON();
		const existingCouponProductsResponse = await service.findAllRows(couponProductModelName, [], {
			coupon_id: coupon.id
		}, 0, null, 'id', 'asc');
		const existingCouponExcludeProductsResponse = await service.findAllRows(couponExcludedProductModelName, [], {
			coupon_id: coupon.id
		}, 0, null, 'id', 'asc');
		const existingCouponCategoriesResponse = await service.findAllRows(couponCategoryModelName, [], {
			coupon_id: coupon.id
		}, 0, null, 'id', 'asc');
		const existingCouponExcludeCategoriesResponse = await service.findAllRows(couponExcludedCategoryModelName, [], {
			coupon_id: coupon.id
		}, 0, null, 'id', 'asc');

		if (existingCouponProductsResponse.count > 0) {
			const existingCouponProducts = await existingCouponProductsResponse.rows;
			await Promise.all(existingCouponProducts.map(async (existingProduct) => {
				const index = await couponProducts.indexOf(JSON.stringify(existingProduct.product_id));
				if (index > -1) {
					const couponProductResponse = await service.upsertRow(couponProductModelName, {
						coupon_id: existingProduct.coupon_id,
						product_id: existingProduct.product_id,
						status: status['ACTIVE']
					}, {
						id: existingProduct.id,
						coupon_id: existingProduct.coupon_id,
						product_id: existingProduct.product_id
					}, audit);
					couponProducts.splice(index, 1);
					return couponProductResponse;
				} else {
					const couponProductResponse = await service.upsertRow(couponProductModelName, {
						coupon_id: existingProduct.coupon_id,
						product_id: existingProduct.product_id,
						status: status['INACTIVE']
					}, {
						id: existingProduct.id,
						coupon_id: existingProduct.coupon_id,
						product_id: existingProduct.product_id
					}, audit);
					return couponProductResponse;
				}
			}));
		}
		await Promise.all(couponProducts.map(async (couponProduct) => {
			const couponProductResponse = await service.upsertRow(couponProductModelName, {
				coupon_id: coupon.id,
				product_id: couponProduct,
				status: status['ACTIVE']
			}, {
				coupon_id: coupon.id,
				product_id: couponProduct
			}, audit);
			return couponProductResponse;
		}));

		if (existingCouponExcludeProductsResponse.count > 0) {
			const existingCouponExcludeProducts = await existingCouponExcludeProductsResponse.rows;
			await Promise.all(existingCouponExcludeProducts.map(async (existingExcludeProduct) => {
				const index = await excludeCouponProducts.indexOf(JSON.stringify(existingExcludeProduct.product_id));
				if (index > -1) {
					const couponExcludeProductResponse = await service.upsertRow(couponExcludedProductModelName, {
						coupon_id: existingExcludeProduct.coupon_id,
						product_id: existingExcludeProduct.product_id,
						status: status['ACTIVE']
					}, {
						id: existingExcludeProduct.id,
						coupon_id: existingExcludeProduct.coupon_id,
						product_id: existingExcludeProduct.product_id
					}, audit);
					excludeCouponProducts.splice(index, 1);
					return couponExcludeProductResponse;
				} else {
					const couponExcludeProductResponse = await service.upsertRow(couponExcludedProductModelName, {
						coupon_id: existingExcludeProduct.coupon_id,
						product_id: existingExcludeProduct.product_id,
						status: status['INACTIVE']
					}, {
						id: existingExcludeProduct.id,
						coupon_id: existingExcludeProduct.coupon_id,
						product_id: existingExcludeProduct.product_id
					}, audit);
					return couponExcludeProductResponse;
				}
			}));
		}
		await Promise.all(excludeCouponProducts.map(async (couponExcludeProduct) => {
			const couponExcludeProductResponse = await service.upsertRow(couponExcludedProductModelName, {
				coupon_id: coupon.id,
				product_id: couponExcludeProduct,
				status: status['ACTIVE']
			}, {
				coupon_id: coupon.id,
				product_id: couponExcludeProduct
			}, audit);
			return couponExcludeProductResponse;
		}));


		if (existingCouponCategoriesResponse.count > 0) {
			const existingCouponCategories = await existingCouponCategoriesResponse.rows;
			await Promise.all(existingCouponCategories.map(async (existingCategory) => {
				const index = await couponCategories.indexOf(JSON.stringify(existingCategory.category_id));
				if (index > -1) {
					const couponCategoryResponse = await service.upsertRow(couponCategoryModelName, {
						coupon_id: existingCategory.coupon_id,
						category_id: existingCategory.category_id,
						status: status['ACTIVE']
					}, {
						id: existingCategory.id,
						coupon_id: existingCategory.coupon_id,
						category_id: existingCategory.category_id
					}, audit);
					couponCategories.splice(index, 1);
					return couponCategoryResponse;
				} else {
					const couponCategoryResponse = await service.upsertRow(couponCategoryModelName, {
						coupon_id: existingCategory.coupon_id,
						category_id: existingCategory.category_id,
						status: status['INACTIVE']
					}, {
						id: existingCategory.id,
						coupon_id: existingCategory.coupon_id,
						category_id: existingCategory.category_id
					}, audit);
					return couponCategoryResponse;
				}
			}));
		}
		await Promise.all(couponCategories.map(async (couponCategory) => {
			const couponCategoryResponse = await service.upsertRow(couponCategoryModelName, {
				coupon_id: coupon.id,
				category_id: couponCategory,
				status: status['ACTIVE']
			}, {
				coupon_id: coupon.id,
				category_id: couponCategory
			}, audit);
			return couponCategoryResponse;
		}));


		if (existingCouponExcludeCategoriesResponse.count > 0) {
			const existingCouponExcludeCategories = await existingCouponExcludeCategoriesResponse.rows;
			await Promise.all(existingCouponExcludeCategories.map(async (existingExcludeCategory) => {
				const index = await excludeCouponCategories.indexOf(JSON.stringify(existingExcludeCategory.category_id));
				if (index > -1) {
					const couponExcludeProductResponse = await service.upsertRow(couponExcludedCategoryModelName, {
						coupon_id: existingExcludeCategory.coupon_id,
						category_id: existingExcludeCategory.category_id,
						status: status['ACTIVE']
					}, {
						id: existingExcludeCategory.id,
						coupon_id: existingExcludeCategory.coupon_id,
						category_id: existingExcludeCategory.category_id
					}, audit);
					excludeCouponCategories.splice(index, 1);
					return couponExcludeProductResponse;
				} else {
					const couponExcludeProductResponse = await service.upsertRow(couponExcludedCategoryModelName, {
						coupon_id: existingExcludeCategory.coupon_id,
						category_id: existingExcludeCategory.category_id,
						status: status['INACTIVE']
					}, {
						id: existingExcludeCategory.id,
						coupon_id: existingExcludeCategory.coupon_id,
						category_id: existingExcludeCategory.category_id
					}, audit);
					return couponExcludeProductResponse;
				}
			}));
		}
		await Promise.all(excludeCouponCategories.map(async (couponCategory) => {
			const couponExcludeProductResponse = await service.upsertRow(couponExcludedCategoryModelName, {
				coupon_id: coupon.id,
				category_id: couponCategory,
				status: status['ACTIVE']
			}, {
				coupon_id: coupon.id,
				category_id: couponCategory
			}, audit);
			return couponExcludeProductResponse;
		}));
		return res.status(200).send('Coupon added successfully.');
	} catch (error) {
		console.log("saveCoupon Error:::", error);
		return res.status(500).send('Internal server error');
	}
}