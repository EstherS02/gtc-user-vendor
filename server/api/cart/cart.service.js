'use strict';

const moment = require('moment');
var _ = require('lodash');
const service = require('../service');
const status = require('../../config/status');
const model = require('../../sqldb/model-connect');

export async function cartCalculation(userID, req) {
	var cart = {};
	var queryObj = {};
	var order = "desc";
	var couponQueryObj = {};
	const field = "created_on";
	const cartModelName = "Cart";
	const couponModelName = "Coupon";
	var promoCode = req.cookies.applied_coupon ? req.cookies.applied_coupon : null;

	var products = [];
	var appliedProducts = [];
	var appliedCategoryProducts = [];
	var couponApplicableProducts = [];
	const productModelName = "Product";

	cart['total_items'] = 0;
	cart['coupon_applied'] = false;
	cart['marketplace_summary'] = {};
	cart['marketplace_products'] = {};
	cart['grant_total'] = 0;
	cart['discount_amount'] = 0;
	cart['grant_total_with_discounted_amount'] = 0;

	const includeArray = [{
		model: model['Product'],
		where: {
			status: status['ACTIVE']
		},
		attributes: ['id', 'product_name', 'product_slug', 'marketplace_id', 'marketplace_type_id', 'vendor_id', 'price', 'moq'],
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
	}];

	queryObj['status'] = status['ACTIVE'];
	queryObj['user_id'] = userID;

	couponQueryObj['code'] = promoCode;

	try {
		const cartResonse = await service.findAllRows(cartModelName, includeArray, queryObj, 0, null, field, order);

		if (cartResonse.count) {
			cart['total_items'] = cartResonse.count;

			const couponIncludeArray = await [{
				model: model['CouponProduct'],
				where: {
					status: status['ACTIVE']
				},
				required: false
			}, {
				model: model['CouponCategory'],
				where: {
					status: status['ACTIVE']
				},
				required: false
			}, {
				model: model['CouponExcludedProduct'],
				where: {
					status: status['ACTIVE']
				},
				required: false
			}, {
				model: model['CouponExcludedCategory'],
				where: {
					status: status['ACTIVE']
				},
				required: false
			}];

			const coupon = await service.findOneRow(couponModelName, couponQueryObj, couponIncludeArray);
			if (coupon) {
				const currentDate = moment().format('YYYY-MM-DD');
				const expiryDate = moment(coupon.expiry_date).format('YYYY-MM-DD');

				const productResponse = await service.findAllRows(productModelName, [], {
					vendor_id: coupon.vendor_id,
					status: status['ACTIVE']
				}, 0, null, 'id', 'asc');
				products = await productResponse.rows;

				if (currentDate <= expiryDate) {
					if (coupon.CouponProducts.length == 0 && coupon.CouponExcludedProducts.length > 0) {
						var couponExcludedProducts = await _.map(coupon.CouponExcludedProducts, 'product_id');
						appliedProducts = await _.filter(products, function(excludeProduct) {
							return couponExcludedProducts.indexOf(excludeProduct.id) === -1;
						});
					} else if (coupon.CouponProducts.length > 0) {
						var couponProducts = await _.map(coupon.CouponProducts, 'product_id');
						appliedProducts = await _.filter(products, function(product) {
							return couponProducts.indexOf(product.id) > -1;
						});
					} else {
						appliedProducts = await products;
					}

					if (coupon.CouponCategories.length == 0 && coupon.CouponExcludedCategories.length > 0) {
						var couponExcludedCategoryProducts = await _.map(coupon.CouponExcludedCategories, 'category_id');
						appliedCategoryProducts = await _.filter(products, function(excludeProduct) {
							return couponExcludedCategoryProducts.indexOf(excludeProduct.product_category_id) === -1;
						});
					} else if (coupon.CouponCategories.length > 0) {
						var couponCategoryProducts = await _.map(coupon.CouponCategories, 'category_id');
						appliedCategoryProducts = await _.filter(products, function(product) {
							return couponCategoryProducts.indexOf(product.product_category_id) > -1;
						});
					} else {
						appliedCategoryProducts = await products;
					}

					if (appliedProducts.length > appliedCategoryProducts.length) {
						var tmpProducts = await _.map(appliedCategoryProducts, 'id');
						couponApplicableProducts = await _.filter(appliedProducts, function(product) {
							return tmpProducts.indexOf(product.id) > -1;
						});
					} else if (appliedCategoryProducts.length > appliedProducts.length) {
						var tmpProducts = await _.map(appliedProducts, 'id');
						couponApplicableProducts = await _.filter(appliedCategoryProducts, function(product) {
							return tmpProducts.indexOf(product.id) > -1;
						});
					} else {
						var tmpProducts = await _.map(appliedCategoryProducts, 'id');
						couponApplicableProducts = await _.filter(appliedProducts, function(product) {
							return tmpProducts.indexOf(product.id) > -1;
						});
					}

					var totalAmount = 0;

					await Promise.all(couponApplicableProducts.map(async (product) => {
						const cartProduct = await cartResonse.rows.find((obj) => obj.product_id == product.id);
						if (cartProduct) {
							totalAmount = await cartProduct.Product.price * cartProduct.quantity;
						}
					}));

					if (totalAmount >= coupon.minimum_spend && totalAmount <= coupon.maximum_spend) {
						cart['coupon_applied'] = true;
						cart['coupon_code'] = coupon.code;
						cart['discount_type'] = coupon.discount_type;
						cart['discount_value'] = coupon.discount_value;
					}
				}
			}

			const marketplaceResponse = await model['Marketplace'].findAll({
				where: {
					status: status['ACTIVE']
				},
				attributes: ['id', 'name', 'code', 'status']
			});
			const marketplace = JSON.parse(JSON.stringify(marketplaceResponse));

			await Promise.all(cartResonse.rows.map((aCart) => {
				aCart['total_price'] = aCart.Product.price * aCart.quantity;
				const index = marketplace.findIndex((obj) => obj.id == aCart.Product.marketplace_id);
				const existsMarketplace = cart['marketplace_products'].hasOwnProperty(marketplace[index].id);
				if (!existsMarketplace) {
					cart['marketplace_summary'][marketplace[index].id] = {};
					cart['marketplace_products'][marketplace[index].id] = {};

					cart['marketplace_summary'][marketplace[index].id].sub_total = 0;
					cart['marketplace_summary'][marketplace[index].id].shipping_ground = 0;
					cart['marketplace_summary'][marketplace[index].id].total = 0;

					cart['marketplace_products'][marketplace[index].id].count = 0;
					cart['marketplace_products'][marketplace[index].id].products = [];
				}

				cart['marketplace_summary'][aCart.Product.marketplace_id].sub_total += aCart.total_price;
				cart['marketplace_summary'][aCart.Product.marketplace_id].total = cart['marketplace_summary'][aCart.Product.marketplace_id].sub_total + cart['marketplace_summary'][aCart.Product.marketplace_id].shipping_ground;

				cart['marketplace_products'][aCart.Product.marketplace_id].count += 1;
				cart['marketplace_products'][aCart.Product.marketplace_id].products.push(aCart);

				const discountProduct = couponApplicableProducts.find((obj) => obj.id == aCart.Product.id);
				if (cart['coupon_applied'] && (discountProduct && cart['discount_amount'] == 0)) {
					if (coupon.discount_type == 1) {
						cart['discount_amount'] = ((discountProduct.price / 100) * coupon.discount_value).toFixed(2);
					} else if (coupon.discount_type == 2 && parseFloat(discountProduct.price).toFixed(2) >= parseFloat(coupon.discount_value).toFixed(2)) {
						cart['discount_amount'] = parseFloat(coupon.discount_value).toFixed(2);
					}
				}
			}));

			await Promise.all(Object.keys(cart['marketplace_summary']).map(async (key) => {
				if (cart['marketplace_summary'].hasOwnProperty(key)) {
					cart['grant_total'] += cart['marketplace_summary'][key].total;
				}
			}));
			cart['grant_total_with_discounted_amount'] = (cart['grant_total'] - cart['discount_amount']).toFixed(2);
		}
		return cart;
	} catch (error) {
		console.log("index Error :::", error);
		return error;
	}
}